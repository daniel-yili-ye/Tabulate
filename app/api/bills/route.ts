import { NextRequest, NextResponse } from "next/server";
import { saveBillData, getBillData } from "@/utils/supabase";
import { formSchema } from "@/schema/formSchema";
import { z } from "zod";
// Import the allocation schema
import { billAllocationSchema } from "@/schema/allocationSchema";

// Define the schema for the entire request body
const billApiRequestBodySchema = z.object({
  form_data: formSchema,
  allocation: billAllocationSchema,
});

// POST /api/bills - Create a new bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the whole body against the schema
    const validationResult = billApiRequestBodySchema.safeParse(body);

    if (!validationResult.success) {
      // If validation fails, return a 400 error with details
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: validationResult.error.flatten(), // Provides detailed errors
        },
        { status: 400 }
      );
    }

    const billId = await saveBillData(validationResult.data);

    return NextResponse.json({
      success: true,
      billId,
      shareUrl: `${request.nextUrl.origin}/bills/${billId}`,
    });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bill" },
      { status: 500 }
    );
  }
}

// GET /api/bills?id=123 - Get a bill by ID
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Bill ID is required" },
        { status: 400 }
      );
    }

    const billData = await getBillData(id);

    if (!billData) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: billData });
  } catch (error) {
    console.error("Error fetching bill:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bill" },
      { status: 500 }
    );
  }
}
