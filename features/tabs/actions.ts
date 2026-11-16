"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { RECEIPTS_BUCKET } from "@/lib/env";
import { createClient, getUser } from "@/lib/supabase/server";
import { conversionSchema, paymentMessageSchema, tabDraftSchema } from "./schema";

export interface ActionResult {
  error: string;
}

const SLUG = /^[A-Za-z0-9_-]{10,32}$/;
const NOT_SIGNED_IN: ActionResult = { error: "Your session expired. Sign in again." };

/**
 * Create a tab (slug = null) or replace one the caller owns. Redirects to the
 * tab on success; returns a message on failure.
 */
export async function saveTab(
  slug: string | null,
  input: unknown,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return NOT_SIGNED_IN;
  if (slug !== null && !SLUG.test(slug)) return { error: "Tab not found." };

  const parsed = tabDraftSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the tab and try again." };
  }
  const draft = parsed.data;

  // A receipt path must point into the caller's own folder.
  if (draft.receiptImagePath && !draft.receiptImagePath.startsWith(`${user.id}/`)) {
    return { error: "That receipt image can't be used." };
  }

  const supabase = await createClient();

  let previousImagePath: string | null = null;
  if (slug) {
    const { data: existing } = await supabase
      .from("tabs")
      .select("receipt_image_path")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) return { error: "Tab not found." };
    previousImagePath = existing.receipt_image_path;
  }

  const targetSlug = slug ?? randomBytes(9).toString("base64url");
  const { error } = await supabase.rpc("save_tab", {
    p_slug: targetSlug,
    p_create: slug === null,
    p_tab: draft,
  });
  if (error) {
    console.error("save_tab failed", error);
    return { error: "Couldn't save the tab. Try again." };
  }

  if (previousImagePath && previousImagePath !== draft.receiptImagePath) {
    await supabase.storage.from(RECEIPTS_BUCKET).remove([previousImagePath]);
  }

  revalidatePath("/tabs");
  revalidatePath(`/tab/${targetSlug}`);
  redirect(slug ? `/tab/${targetSlug}` : `/tab/${targetSlug}?share=1`);
}

/**
 * Record what the owner was charged for a tab in another currency, or remove
 * that again with `null`.
 */
export async function setTabConversion(
  slug: string,
  input: unknown,
): Promise<ActionResult | void> {
  const user = await getUser();
  if (!user) return NOT_SIGNED_IN;
  if (!SLUG.test(slug)) return { error: "Tab not found." };

  const parsed = conversionSchema.nullable().safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the amount and try again." };
  }
  const conversion = parsed.data;

  const supabase = await createClient();
  // Row level security limits both queries to the caller's own tabs.
  const { data: tab } = await supabase
    .from("tabs")
    .select("currency")
    .eq("slug", slug)
    .maybeSingle();
  if (!tab) return { error: "Tab not found." };
  if (conversion?.currency === tab.currency) {
    return { error: "Pick a currency other than the one the tab is in." };
  }

  const { error } = await supabase
    .from("tabs")
    .update({
      settle_currency: conversion?.currency ?? null,
      settle_total_cents: conversion?.totalCents ?? null,
    })
    .eq("slug", slug);
  if (error) {
    console.error("set tab conversion failed", error);
    return { error: "Couldn't save the conversion. Try again." };
  }

  revalidatePath(`/tab/${slug}`);
}

/** Change one of the owner's settings for a tab from the tab page. */
async function updateOwnTab(
  slug: string,
  values: { payment_message: string } | { allow_guest_paid: boolean },
): Promise<ActionResult | void> {
  const user = await getUser();
  if (!user) return NOT_SIGNED_IN;
  if (!SLUG.test(slug)) return { error: "Tab not found." };

  const supabase = await createClient();
  // Row level security limits the update to the caller's own tabs.
  const { data, error } = await supabase
    .from("tabs")
    .update(values)
    .eq("slug", slug)
    .select("slug")
    .maybeSingle();
  if (error) {
    console.error("update tab failed", error);
    return { error: "Couldn't save that. Try again." };
  }
  if (!data) return { error: "Tab not found." };

  revalidatePath(`/tab/${slug}`);
}

export async function setTabPaymentMessage(
  slug: string,
  input: unknown,
): Promise<ActionResult | void> {
  const parsed = paymentMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the note and try again." };
  }
  return updateOwnTab(slug, { payment_message: parsed.data });
}

/** Whether people other than the owner may mark someone as paid. */
export async function setTabAllowGuestPaid(
  slug: string,
  allow: boolean,
): Promise<ActionResult | void> {
  if (typeof allow !== "boolean") return { error: "Couldn't save that. Try again." };
  return updateOwnTab(slug, { allow_guest_paid: allow });
}

/**
 * Mark one person's share as paid or not. Open to anyone holding the link when
 * the owner allows it; the database function is what decides.
 */
export async function setParticipantPaid(
  slug: string,
  participantId: string,
  paid: boolean,
): Promise<ActionResult | void> {
  if (
    !SLUG.test(slug) ||
    !z.uuid().safeParse(participantId).success ||
    typeof paid !== "boolean"
  ) {
    return { error: "Tab not found." };
  }

  const supabase = await createClient();
  const { data: changed, error } = await supabase.rpc("set_participant_paid", {
    p_slug: slug,
    p_participant_id: participantId,
    p_paid: paid,
  });
  if (error) {
    console.error("set_participant_paid failed", error);
    return { error: "Couldn't update that. Try again." };
  }
  // The owner may have turned this off since the page was loaded.
  revalidatePath(`/tab/${slug}`);
  if (!changed) return { error: "Only the tab's owner can change who has paid." };
}

export async function deleteTab(slug: string): Promise<ActionResult | void> {
  const user = await getUser();
  if (!user) return NOT_SIGNED_IN;
  if (!SLUG.test(slug)) return { error: "Tab not found." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tabs")
    .delete()
    .eq("slug", slug)
    .select("receipt_image_path")
    .maybeSingle();
  if (error) {
    console.error("delete tab failed", error);
    return { error: "Couldn't delete the tab. Try again." };
  }
  if (!data) return { error: "Tab not found." };

  if (data.receipt_image_path) {
    await supabase.storage.from(RECEIPTS_BUCKET).remove([data.receipt_image_path]);
  }

  revalidatePath("/tabs");
  revalidatePath(`/tab/${slug}`);
}
