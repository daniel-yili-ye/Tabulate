import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const prompt = `Parse the following receipt into a structured JSON format. 

I need you to extract:
- Business name
- Date of transaction
- Subtotal
- Total amount
- Tax amount (if present)
- Tip amount (if present)
- Discount amount (if present)
- All individual items purchased with their prices

Format the extracted information in this exact JSON schema:
{
  "subtotal": number,
  "total": number,
  "businessName": string,
  "date": string,
  "Items": [
    {
      "item": string,
      "price": number (or undefined if not available)
    }
  ],
  "tax": number (or undefined if not present),
  "tip": number (or undefined if not present),
  "discount": number (or undefined if not present)
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

    // Convert the file to a byte array
    const imageBytes = await imageFile.arrayBuffer();

    // Create a parts array with the image and prompt
    const parts = [
      {
        inlineData: {
          data: Buffer.from(imageBytes).toString("base64"),
          mimeType: imageFile.type,
        },
      },
      { text: prompt },
    ];

    // Generate content with the image and prompt
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    const response = result.response;
    const text = response.text();
    console.log(text);

    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = text;

      // Check if the response is wrapped in markdown code blocks
      const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
      const match = text.match(jsonRegex);

      if (match && match[1]) {
        // Extract just the JSON part
        jsonText = match[1].trim();
      }

      // Try to parse the response as JSON
      const parsedData = JSON.parse(jsonText);

      // Check if there's an error field in the response
      if (parsedData.error) {
        return NextResponse.json({ error: parsedData.error }, { status: 400 });
      }

      return NextResponse.json(parsedData);
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
