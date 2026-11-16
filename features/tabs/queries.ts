import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY, isCurrency } from "./currency";
import { profileSchema, sharedTabSchema, type Profile, type SharedTab } from "./schema";

/** One tab by its share slug. Public: works with or without a session. */
export const getSharedTab = cache(async (slug: string): Promise<SharedTab | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_shared_tab", { p_slug: slug });
  if (error) throw new Error(`Could not load tab: ${error.message}`);
  if (!data) return null;
  return sharedTabSchema.parse(data);
});

export interface TabSummary {
  slug: string;
  businessName: string;
  date: string;
  currency: string;
  totalCents: number;
  people: number;
  /** How many of those people have been marked as paid. */
  paid: number;
}

export const TABS_PER_PAGE = 10;

export interface TabFilters {
  /** Matches anywhere in the tab's name. */
  search: string;
  /** Inclusive receipt date range, as YYYY-MM-DD or empty. */
  from: string;
  to: string;
  /** 1-based. */
  page: number;
}

export interface TabPage {
  tabs: TabSummary[];
  /** How many tabs match the filters, across all pages. */
  total: number;
  page: number;
  pageCount: number;
}

/**
 * One page of the signed-in user's tabs, newest first. Row level security
 * scopes the query to their own tabs.
 */
export async function listMyTabs(filters: TabFilters): Promise<TabPage> {
  const supabase = await createClient();

  const fetchPage = (page: number) => {
    let query = supabase
      .from("tabs")
      .select(
        "slug, business_name, receipt_date, currency, tax_cents, tip_cents, discount_cents, tab_items(price_cents), tab_participants(paid)",
        { count: "exact" },
      );
    if (filters.search) {
      // Escape the LIKE wildcards so they are matched literally.
      query = query.ilike(
        "business_name",
        `%${filters.search.replace(/[\\%_]/g, "\\$&")}%`,
      );
    }
    if (filters.from) query = query.gte("receipt_date", filters.from);
    if (filters.to) query = query.lte("receipt_date", filters.to);

    const start = (page - 1) * TABS_PER_PAGE;
    return query
      .order("receipt_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(start, start + TABS_PER_PAGE - 1);
  };

  let page = Math.max(1, filters.page);
  let { data, error, count } = await fetchPage(page);
  // Past the end (a stale link, or tabs were deleted): show the last page.
  const pageCount = Math.max(1, Math.ceil((count ?? 0) / TABS_PER_PAGE));
  if (!error && page > pageCount) {
    page = pageCount;
    ({ data, error, count } = await fetchPage(page));
  }
  if (error || !data) throw new Error(`Could not load tabs: ${error?.message}`);

  return { total: count ?? 0, page, pageCount, tabs: data.map(toSummary) };
}

type TabRow = {
  slug: string;
  business_name: string;
  receipt_date: string;
  currency: string;
  tax_cents: number;
  tip_cents: number;
  discount_cents: number;
  tab_items: { price_cents: number }[];
  tab_participants: { paid: boolean }[];
};

function toSummary(tab: TabRow): TabSummary {
  return {
    slug: tab.slug,
    businessName: tab.business_name,
    date: tab.receipt_date,
    currency: tab.currency,
    people: tab.tab_participants.length,
    paid: tab.tab_participants.filter((person) => person.paid).length,
    totalCents:
      tab.tab_items.reduce((sum, item) => sum + item.price_cents, 0) +
      tab.tax_cents +
      tab.tip_cents -
      tab.discount_cents,
  };
}

export const getMyProfile = cache(async (userId: string): Promise<Profile> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("payment_message, currency")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load profile: ${error.message}`);
  return profileSchema.parse({
    paymentMessage: data?.payment_message ?? "",
    currency: isCurrency(data?.currency) ? data.currency : DEFAULT_CURRENCY,
  });
});
