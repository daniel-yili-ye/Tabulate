import { createClient, User } from "@supabase/supabase-js";
import { clientEnv, serverEnv } from "@/lib/env";
import type { TabData, Tab } from "@/types/database";

export const supabaseServer = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY || clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Save tab data using the new unified data column structure
 */
export async function saveTabData(
  tabData: TabData, 
  slug: string, 
  userId?: string | null,
  receiptImageUrl?: string | null
): Promise<string | undefined> {
  const { data, error } = await supabaseServer
    .from("tabs")
    .insert([{
      data: tabData,
      slug,
      user_id: userId || null,
      receipt_image_url: receiptImageUrl || null,
    }])
    .select("id");
  
  if (error) throw error;
  return data?.[0]?.id as string | undefined;
}

/**
 * Get tab data by slug
 * Handles both new (data column) and legacy (form_data/allocation columns) formats
 */
export async function getTabData(slug: string): Promise<Tab | null> {
  const { data, error } = await supabaseServer
    .from("tabs")
    .select("*")
    .eq("slug", slug)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw error;
  }
  
  // If using new data column, return as-is
  if (data.data) {
    return data as Tab;
  }
  
  // Legacy format: transform form_data + allocation to new structure
  if (data.form_data && data.allocation) {
    const legacyFormData = data.form_data as {
      stepReceiptUpload?: {
        receiptImageURL?: string;
      };
      stepItems: {
        businessName: string;
        date: string;
        Items: { item: string; price: number }[];
        tax?: number;
        tip?: number;
        discount?: number;
        subtotal: number;
        total: number;
      };
      stepParticipants: { id: number; name: string }[];
      stepAllocateItems: number[][];
    };
    
    const transformedData: TabData = {
      receipt: {
        businessName: legacyFormData.stepItems.businessName,
        date: legacyFormData.stepItems.date,
        items: legacyFormData.stepItems.Items.map(i => ({
          item: i.item || "",
          price: i.price || 0,
        })),
        tax: legacyFormData.stepItems.tax,
        tip: legacyFormData.stepItems.tip,
        discount: legacyFormData.stepItems.discount,
        subtotal: legacyFormData.stepItems.subtotal,
        total: legacyFormData.stepItems.total,
      },
      participants: legacyFormData.stepParticipants,
      allocations: legacyFormData.stepAllocateItems.map((participantIds, index) => ({
        itemIndex: index,
        splitType: "equal" as const,
        participantIds,
      })),
      computed: data.allocation,
    };
    
    return {
      ...data,
      data: transformedData,
      receipt_image_url: legacyFormData.stepReceiptUpload?.receiptImageURL || null,
    } as Tab;
  }
  
  return null;
}

/**
 * Get all tabs for a specific user
 */
export async function getUserTabs(userId: string): Promise<Tab[]> {
  const { data, error } = await supabaseServer
    .from("tabs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data as Tab[];
}

/**
 * Update an existing tab (only owner can update)
 */
export async function updateTabData(
  slug: string,
  tabData: TabData,
  userId: string
): Promise<boolean> {
  const { error } = await supabaseServer
    .from("tabs")
    .update({ data: tabData })
    .eq("slug", slug)
    .eq("user_id", userId);
  
  if (error) throw error;
  return true;
}

/**
 * Delete a tab (only owner can delete)
 */
export async function deleteTab(slug: string, userId: string): Promise<boolean> {
  const { error } = await supabaseServer
    .from("tabs")
    .delete()
    .eq("slug", slug)
    .eq("user_id", userId);
  
  if (error) throw error;
  return true;
}

// ============================================================================
// LEGACY: Keep for backward compatibility during migration
// ============================================================================

/**
 * @deprecated Use saveTabData instead
 */
export async function saveLegacyTabData(
  tabData: { form_data: unknown; allocation: unknown }, 
  slug: string
): Promise<string | undefined> {
  const { data, error } = await supabaseServer
    .from("tabs")
    .insert([{ ...tabData, slug }])
    .select("id");
  
  if (error) throw error;
  return data?.[0]?.id as string | undefined;
}
