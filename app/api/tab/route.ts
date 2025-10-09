import { NextRequest, NextResponse } from "next/server";
import { saveTabData, getTabData } from "@/lib/supabase/server";
import { formSchema } from "@/lib/validation/formSchema";
import { z } from "zod";
import { billAllocationSchema } from "@/lib/validation/allocationSchema";
import { nanoid } from 'nanoid';  

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
    
    const slug = nanoid(8);
    const tabId = await saveTabData(validationResult.data, slug);

    return NextResponse.json({
      success: true,
      tabId,
      shareUrl: `${request.nextUrl.origin}/tab/${slug}`,
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
    const slug = request.nextUrl.searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Tab ID is required" },
        { status: 400 }
      );
    }

    const tabData = await getTabData(slug);

    if (!tabData) {
      return NextResponse.json(
        { success: false, error: "Tab not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tabData });
  } catch (error) {
    console.error("Error fetching tab:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tab" },
      { status: 500 }
    );
  }
}
