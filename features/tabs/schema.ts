import { z } from "zod";
import { parseIsoDate } from "./format.ts";
import { LIMITS } from "./limits.ts";

export const SPLIT_TYPES = ["equal", "shares", "percentage", "custom"] as const;
export type SplitType = (typeof SPLIT_TYPES)[number];

export { LIMITS };

const cents = z
  .number("Enter an amount")
  .int()
  .min(0)
  .max(LIMITS.maxCents, "Amount is too large");

const shareSchema = z.object({
  participantId: z.uuid(),
  /** Shares, whole percent or cents, depending on the item's split type. */
  weight: z.number().int().min(0).max(LIMITS.maxCents),
});

const itemSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().max(LIMITS.itemNameLength),
    priceCents: cents,
    splitType: z.enum(SPLIT_TYPES),
    shares: z.array(shareSchema).max(LIMITS.maxParticipants),
  })
  .superRefine((item, ctx) => {
    const fail = (message: string) =>
      ctx.addIssue({ code: "custom", path: ["shares"], message });
    const total = item.shares.reduce((sum, share) => sum + share.weight, 0);

    if (item.shares.length === 0) {
      fail("Pick at least one person");
    } else if (item.splitType === "shares" && item.shares.some((s) => s.weight < 1)) {
      fail("Everyone selected needs at least 1 share");
    } else if (item.splitType === "percentage" && total !== 100) {
      fail("Percentages must add up to 100%");
    } else if (item.splitType === "custom" && total !== item.priceCents) {
      fail("Amounts must add up to the item price");
    }
  });

const participantSchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(LIMITS.nameLength, "Name is too long"),
});

const paymentMessage = z
  .string()
  .trim()
  .max(
    LIMITS.paymentMessageLength,
    `Keep it under ${LIMITS.paymentMessageLength} characters`,
  );

export const tabDraftSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(1, "Enter a name for this tab")
      .max(LIMITS.businessNameLength, "Name is too long"),
    date: z
      .string()
      .refine((value) => parseIsoDate(value) !== null, "Pick a valid date"),
    taxCents: cents,
    tipCents: cents,
    discountCents: cents,
    receiptImagePath: z.string().max(200).nullable(),
    /** This tab's own note. Starts as the default from the user's settings. */
    paymentMessage,
    participants: z
      .array(participantSchema)
      .min(LIMITS.minParticipants, "Add at least 2 people")
      .max(LIMITS.maxParticipants),
    items: z.array(itemSchema).min(1, "Add at least one item").max(LIMITS.maxItems),
  })
  .superRefine((tab, ctx) => {
    const subtotal = tab.items.reduce((sum, item) => sum + item.priceCents, 0);
    if (tab.discountCents > subtotal) {
      ctx.addIssue({
        code: "custom",
        path: ["discountCents"],
        message: "Discount can't be more than the subtotal",
      });
    }

    const participantIds = new Set(tab.participants.map((p) => p.id));
    tab.items.forEach((item, index) => {
      const seen = new Set<string>();
      for (const share of item.shares) {
        if (!participantIds.has(share.participantId) || seen.has(share.participantId)) {
          ctx.addIssue({
            code: "custom",
            path: ["items", index, "shares"],
            message: "Pick people from this tab",
          });
          return;
        }
        seen.add(share.participantId);
      }
    });
  });

/** A tab as it is edited and saved. Money is integer cents throughout. */
export type TabDraft = z.infer<typeof tabDraftSchema>;
export type TabItem = TabDraft["items"][number];
export type TabParticipant = TabDraft["participants"][number];
export type ItemShare = TabItem["shares"][number];

/** A saved tab as returned by the `get_shared_tab` database function. */
export const sharedTabSchema = z.object({
  slug: z.string(),
  isOwner: z.boolean().nullable().transform((value) => value === true),
  businessName: z.string(),
  date: z.string(),
  taxCents: z.number(),
  tipCents: z.number(),
  discountCents: z.number(),
  receiptImagePath: z.string().nullable(),
  paymentMessage: z.string(),
  participants: z.array(z.object({ id: z.string(), name: z.string() })),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      priceCents: z.number(),
      splitType: z.enum(SPLIT_TYPES),
      shares: z.array(z.object({ participantId: z.string(), weight: z.number() })),
    }),
  ),
});

export type SharedTab = z.infer<typeof sharedTabSchema>;

/** Account settings. The payment note here is the default for new tabs. */
export const profileSchema = z.object({ paymentMessage });

export type Profile = z.infer<typeof profileSchema>;
