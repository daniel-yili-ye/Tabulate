import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";
import { receiptBaseSchema, wizard2Schema } from "@/lib/validation/formSchema";

// Create a custom Google provider instance using GEMINI_API_KEY
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
    const imageBuffer = Buffer.from(imageBytes);

    const prompt = `Extract the following receipt data:

1. Business name - name of the store or restaurant
2. Date - transaction date in YYYY-MM-DD format
3. Items - all line items with their names and prices
4. Discount - any discount amount applied (if present)
5. Tax - tax amount (if present)
6. Tip - tip amount (if present)

Important guidelines:
- Extract all visible line items
- Ensure prices are accurate numbers (not strings)
- If an item price is unclear, use null
- For the date, convert any format to YYYY-MM-DD
- Only include discount, tax, and tip if they are explicitly shown on the receipt
- If the image is not a receipt or is unreadable, return null values`;

    console.log("Starting Gemini API call with Vercel AI SDK...");
    const startTime = Date.now();

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      output: Output.object({
        schema: receiptBaseSchema,
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              image: imageBuffer,
              mediaType: imageFile.type,
            },
          ],
        },
      ],
    });

    const endTime = Date.now();
    console.log(`Gemini API call completed in ${endTime - startTime}ms`);

    // result.output is already validated against receiptSchema by AI SDK
    // Apply wizard2Schema transforms (date conversion, subtotal/total calculation, etc.)
    const transformedData = wizard2Schema.parse(result.output);

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      {
        error: "Failed to process the receipt image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
