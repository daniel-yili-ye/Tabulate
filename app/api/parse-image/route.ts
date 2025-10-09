import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { wizard2Schema } from "@/lib/validation/formSchema";

// Use Edge Runtime for better performance (still 10s limit on free plan)
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

const prompt = `Parse the following receipt into a structured JSON format. 

I need you to extract:
- Business name
- Date of transaction
- Discount amount (if present)
- Tax amount (if present)
- Tip amount (if present)
- All individual items purchased with their prices
- Total amount

Format the extracted information in this exact JSON schema:
{
  "businessName": string,
  "date": string,
  "Items": [
    {
      "item": string,
      "price": number (or null if not available)
    }
  ],
  "discount": number (or null if not present),
  "tax": number (or null if not present),
  "tip": number (or null if not present),
  "total": number
}

A few important notes:
1. Make sure each field matches the exact format specified
2. For the "Items" array, include all line items listed on the receipt
3. Return only the valid JSON object, no additional explanation
4. Ensure all number values are parsed as actual numbers, not strings
5. Format the date in a standard ISO format (YYYY-MM-DD)
6. If you cannot read the receipt clearly or extract the required information, respond with a JSON object containing an "error" field with a descriptive message.
7. If the image doesn't appear to be a receipt, respond with a JSON object containing an "error" field with the message "The uploaded image does not appear to be a receipt."`;

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
    console.log(text);

    try {
      let jsonText = text;

      const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
      const match = text.match(jsonRegex);

      if (match && match[1]) {
        jsonText = match[1].trim();
      }

      const parsedData = JSON.parse(jsonText);

      if (parsedData.error) {
        return NextResponse.json({ error: parsedData.error }, { status: 400 });
      }

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
