import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { wizard2Schema } from "@/lib/validation/formSchema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const runtime = 'edge';

// Define the response schema for structured output
const receiptSchema = {
  type: SchemaType.OBJECT as const,
  properties: {
    businessName: {
      type: SchemaType.STRING as const,
      description: "The name of the business on the receipt",
      nullable: false,
    },
    date: {
      type: SchemaType.STRING as const,
      description: "Transaction date in ISO format (YYYY-MM-DD)",
      nullable: false,
    },
    Items: {
      type: SchemaType.ARRAY as const,
      description: "List of all items purchased",
      items: {
        type: SchemaType.OBJECT as const,
        properties: {
          item: {
            type: SchemaType.STRING as const,
            description: "Item name or description",
            nullable: false,
          },
          price: {
            type: SchemaType.NUMBER as const,
            description: "Item price",
            nullable: true,
          },
        },
        required: ["item"],
      },
    },
    discount: {
      type: SchemaType.NUMBER as const,
      description: "Discount amount if present",
      nullable: true,
    },
    tax: {
      type: SchemaType.NUMBER as const,
      description: "Tax amount if present",
      nullable: true,
    },
    tip: {
      type: SchemaType.NUMBER as const,
      description: "Tip amount if present",
      nullable: true,
    },
  },
  required: ["businessName", "date", "Items"],
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: receiptSchema,
  },
});

const prompt = `Parse this receipt image and extract the following information:

1. Business name - the name of the store or restaurant
2. Date - the transaction date in YYYY-MM-DD format
3. Items - all line items with their names and prices
4. Discount - any discount amount applied (if present)
5. Tax - tax amount (if present)
6. Tip - tip amount (if present)

Important guidelines:
- Extract all visible line items from the receipt
- Ensure prices are accurate numbers (not strings)
- If an item price is unclear, use null
- For the date, convert any format to YYYY-MM-DD
- Only include discount, tax, and tip if they are explicitly shown on the receipt
- If the image is not a receipt or is unreadable, include an "error" field with a descriptive message`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const imageBytes = await imageFile.arrayBuffer();

    const parts = [
      {
        inlineData: {
          data: Buffer.from(imageBytes).toString("base64"),
          mimeType: imageFile.type,
        },
      },
      { text: prompt },
    ];

    console.log("Starting Gemini API call...");
    const startTime = Date.now();
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });
    
    const endTime = Date.now();
    console.log(`Gemini API call completed in ${endTime - startTime}ms`);

    const response = result.response;
    const text = response.text();
    console.log("Structured output response:", text);

    try {
      // Structured output guarantees valid JSON, no need to strip markdown
      const parsedData = JSON.parse(text);

      // Check if the model returned an error field
      if (parsedData.error) {
        return NextResponse.json({ error: parsedData.error }, { status: 400 });
      }

      // Validate against our Zod schema
      const validationResult = wizard2Schema.safeParse(parsedData);

      if (!validationResult.success) {
        console.error(
          "AI response failed schema validation:",
          validationResult.error.flatten()
        );
        return NextResponse.json(
          {
            error:
              "AI failed to return data in the expected format. Please try again.",
            details: validationResult.error.flatten(),
          },
          { status: 500 }
        );
      }

      return NextResponse.json(validationResult.data);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError, text);
      return NextResponse.json(
        {
          error:
            "Failed to parse the receipt. Please try again with a clearer image.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to process the receipt image" },
      { status: 500 }
    );
  }
}
