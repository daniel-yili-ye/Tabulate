import { NextRequest, NextResponse } from "next/server";
import { saveTabData, getTabData, saveLegacyTabData } from "@/lib/supabase/server";
import { createTabRequestSchema, tabDataSchema } from "@/lib/validation/tabSchema";
import { computeAllocation } from "@/lib/billing/billSplitter";
import { nanoid } from "nanoid";

// Legacy imports for backward compatibility
import { formSchema } from "@/lib/validation/formSchema";
import { tabAllocationSchema } from "@/lib/validation/allocationSchema";
import { z } from "zod";

// Legacy schema for old clients
const legacyTabApiRequestBodySchema = z.object({
  form_data: formSchema,
  allocation: tabAllocationSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = nanoid(8);

    // Try new schema first
    const newSchemaResult = createTabRequestSchema.safeParse(body);
    
    if (newSchemaResult.success) {
      // New format: compute allocation and save
      const { receipt, participants, allocations, receiptImageUrl } = newSchemaResult.data;
      const computed = computeAllocation(receipt, participants, allocations);
      
      const tabData = {
        receipt,
        participants,
        allocations,
        computed,
      };
      
      // Validate the complete data
      tabDataSchema.parse(tabData);
      
      const tabId = await saveTabData(tabData, slug, null, receiptImageUrl);

      return NextResponse.json({
        success: true,
        tabId,
        shareUrl: `${request.nextUrl.origin}/tab/${slug}`,
      });
    }

    // Fall back to legacy schema
    const legacyResult = legacyTabApiRequestBodySchema.safeParse(body);
    
    if (legacyResult.success) {
      const tabId = await saveLegacyTabData(legacyResult.data, slug);

      return NextResponse.json({
        success: true,
        tabId,
        shareUrl: `${request.nextUrl.origin}/tab/${slug}`,
      });
    }

    // Both schemas failed
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request body",
        details: newSchemaResult.error.flatten(),
      },
      { status: 400 }
    );
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
