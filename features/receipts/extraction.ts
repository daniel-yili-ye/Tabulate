import { z } from "zod";
import { dollarsToCents, formatCents, parseIsoDate } from "../tabs/format.ts";
import { LIMITS } from "../tabs/limits.ts";

/** What the model is asked to return. Kept flat and transform-free on purpose. */
export const extractionSchema = z.object({
  isReceipt: z
    .boolean()
    .describe("False if the image is not a readable receipt, bill or invoice."),
  businessName: z.string().nullable().describe("Name of the store or restaurant."),
  date: z
    .string()
    .nullable()
    .describe("Transaction date as YYYY-MM-DD, or null if it is not printed."),
  items: z
    .array(
      z.object({
        name: z.string().describe("Item name as printed, without the price."),
        quantity: z
          .number()
          .nullable()
          .describe("Quantity purchased if printed, otherwise null."),
        lineTotal: z
          .number()
          .nullable()
          .describe(
            "Total charged for this line (quantity x unit price). Null if unreadable.",
          ),
      }),
    )
    .describe("Every purchased line item, in printed order."),
  tax: z.number().nullable().describe("Sum of all taxes, or null."),
  tip: z
    .number()
    .nullable()
    .describe("Tip, gratuity or service charge actually charged, or null."),
  discount: z
    .number()
    .nullable()
    .describe("Sum of all discounts and promotions as a positive number, or null."),
  total: z.number().nullable().describe("Grand total charged, or null."),
});

export type Extraction = z.infer<typeof extractionSchema>;

export const EXTRACTION_PROMPT = `You are reading a photo of a receipt so that a group can split the bill.

Rules:
- List every purchased line item once, in printed order.
- lineTotal is the amount charged for the whole line. For "3 x Beer @ 6.00" the lineTotal is 18.00 and quantity is 3.
- Modifiers and add-ons with their own price are separate items. Free modifiers are not items.
- Do not list subtotal, tax, tip, service charge, discount, total, payment or change lines as items; use the dedicated fields.
- Discounts and promotions go in "discount" as a positive number, never as negative items.
- Only report tax, tip and discount that are printed. Do not calculate or guess them. Ignore suggested tip amounts.
- Never invent items or prices. If a price is unreadable, use null.
- If the image is not a receipt or cannot be read, set isReceipt to false and return an empty items list.`;

export interface ParsedReceipt {
  businessName: string;
  /** YYYY-MM-DD as printed, or null. The client checks it against its own "today". */
  date: string | null;
  items: { name: string; priceCents: number }[];
  taxCents: number;
  tipCents: number;
  discountCents: number;
  /** Set when the extracted lines do not add up to the printed total. */
  warning: string | null;
}

const clampCents = (cents: number) => Math.min(Math.max(cents, 0), LIMITS.maxCents);

/** Turn raw model output into trusted, bounded values. Null if nothing usable. */
export function normalizeExtraction(raw: Extraction): ParsedReceipt | null {
  if (!raw.isReceipt) return null;

  let discountCents = Math.abs(dollarsToCents(raw.discount));
  const items: ParsedReceipt["items"] = [];

  for (const item of raw.items) {
    const name = item.name.trim();
    const cents = dollarsToCents(item.lineTotal);
    if (cents < 0) {
      // A negative line is a discount the model left among the items.
      discountCents += -cents;
      continue;
    }
    // A printed price of zero is a free modifier or a combo component, which
    // nobody needs to pay for. An unreadable price (null) is kept so that the
    // user can fill it in.
    if (item.lineTotal === 0 || (!name && cents === 0)) continue;

    const quantity = item.quantity ?? 1;
    const label = quantity > 1 && !/^\d/.test(name) ? `${quantity} x ${name}` : name;
    items.push({
      name: label.slice(0, LIMITS.itemNameLength),
      priceCents: clampCents(cents),
    });
    if (items.length === LIMITS.maxItems) break;
  }

  if (items.length === 0) return null;

  const taxCents = clampCents(dollarsToCents(raw.tax));
  const tipCents = clampCents(dollarsToCents(raw.tip));
  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0);
  discountCents = Math.min(clampCents(discountCents), subtotalCents);

  const computedTotal = subtotalCents + taxCents + tipCents - discountCents;
  const printedTotal = raw.total == null ? null : dollarsToCents(raw.total);
  const warning =
    printedTotal !== null && printedTotal !== computedTotal
      ? `The items add up to ${formatCents(computedTotal)}, but the receipt total reads ${formatCents(printedTotal)}. Double-check them against the photo.`
      : null;

  return {
    businessName: (raw.businessName ?? "").trim().slice(0, LIMITS.businessNameLength),
    date: raw.date && parseIsoDate(raw.date) ? raw.date : null,
    items,
    taxCents,
    tipCents,
    discountCents,
    warning,
  };
}
