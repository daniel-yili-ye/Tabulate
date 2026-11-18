import { formatCents } from "./format.ts";
import type { PersonItem } from "./split.ts";

/**
 * How one person's part of an item was worked out, e.g. "2 of 5 shares of
 * $48.00". Null when they had the whole item, which needs no explaining.
 */
export function shareNote(item: PersonItem, currency: string): string | null {
  if (item.sharedBy < 2) return null;
  const price = formatCents(item.priceCents, currency);

  switch (item.splitType) {
    case "equal":
      return `1/${item.sharedBy} of ${price}, split equally`;
    case "shares":
      return `${item.weight} of ${item.weightTotal} shares of ${price}`;
    case "percentage":
      return `${item.weight}% of ${price}`;
    case "custom":
      return `Set amount, out of ${price}`;
  }
}
