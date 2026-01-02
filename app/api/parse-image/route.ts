import { generateText, Output, NoObjectGeneratedError } from "ai";
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

    // Check if the AI SDK successfully generated structured output
    if (result.output === undefined || result.output === null) {
      console.error("AI SDK returned undefined/null output");
      return NextResponse.json(
        {
          error:
            "Failed to parse the receipt. Please try again with a clearer image.",
        },
        { status: 400 }
      );
    }

    // Check if the AI returned null/empty values indicating an unreadable receipt
    // This happens when the AI follows the prompt instruction to "return null values"
    // for unreadable images. We must detect this BEFORE wizard2Schema transforms
    // null date to today's date and empty Items to [{ item: "", price: 0 }]
    const rawOutput = result.output;
    const hasNoBusinessName = !rawOutput.businessName;
    const hasNoDate = !rawOutput.date;
    const hasNoItems =
      !rawOutput.Items ||
      rawOutput.Items.length === 0 ||
      rawOutput.Items.every((item) => !item.item || item.item.trim() === "");

    if (hasNoBusinessName && hasNoDate && hasNoItems) {
      console.error("AI returned empty/null values - receipt likely unreadable", rawOutput);
      return NextResponse.json(
        {
          error:
            "Could not extract receipt data. Please ensure the image is a clear photo of a receipt.",
        },
        { status: 400 }
      );
    }

    // Apply wizard2Schema transforms (date conversion, subtotal/total calculation, etc.)
    // Use safeParse to provide informative error messages
    const validationResult = wizard2Schema.safeParse(result.output);

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
  } catch (error) {
    console.error("Error processing image:", error);

    // Handle NoObjectGeneratedError specifically for user-friendly messages
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error("NoObjectGeneratedError details:", {
        cause: error.cause,
        text: error.text,
      });
      return NextResponse.json(
        {
          error:
            "Failed to parse the receipt. Please try again with a clearer image.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process the receipt image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
