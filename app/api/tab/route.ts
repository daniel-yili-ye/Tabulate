import { NextRequest, NextResponse } from "next/server";
import { saveBillData, getBillData } from "@/lib/supabase/server";
import { formSchema } from "@/lib/validation/formSchema";
import { z } from "zod";
import { billAllocationSchema } from "@/lib/validation/allocationSchema";

const billApiRequestBodySchema = z.object({
  form_data: formSchema,
  allocation: billAllocationSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = billApiRequestBodySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const billId = await saveBillData(validationResult.data);

    return NextResponse.json({
      success: true,
      billId,
      shareUrl: `${request.nextUrl.origin}/tab/${billId}`,
    });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bill" },
      { status: 500 }
    );
  }
}

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
