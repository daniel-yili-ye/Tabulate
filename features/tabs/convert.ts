import { currencyDigits } from "./currency.ts";
import { allocate, type SplitInput } from "./split.ts";

/**
 * Restate a tab in another currency so that it totals exactly `targetTotal`,
 * the amount the owner was really charged. Every amount is scaled by the same
 * implied rate and rounded so that the items, tax, tip and discount still add
 * up, which means the split of the result adds up to `targetTotal` too.
 */
export function convertTab<T extends SplitInput>(tab: T, targetTotal: number): T {
  const prices = tab.items.map((item) => item.priceCents);
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  const total = subtotal + tab.taxCents + tab.tipCents - tab.discountCents;
  // Nothing to scale from.
  if (total <= 0 || targetTotal <= 0) return tab;

  // Discount at the implied rate, rounded half up. The rest is then divided
  // so that everything nets out to the target.
  const discountCents = Number(
    (BigInt(tab.discountCents) * BigInt(targetTotal) * 2n + BigInt(total)) /
      (BigInt(total) * 2n),
  );
  const parts = allocate(targetTotal + discountCents, [
    ...prices,
    tab.taxCents,
    tab.tipCents,
  ]);

  return {
    ...tab,
    discountCents,
    taxCents: parts[prices.length],
    tipCents: parts[prices.length + 1],
    items: tab.items.map((item, index) => ({
      ...item,
      priceCents: parts[index],
      // Custom splits are amounts, so they are scaled with the price.
      shares:
        item.splitType === "custom"
          ? allocate(
              parts[index],
              item.shares.map((share) => share.weight),
            ).map((weight, position) => ({ ...item.shares[position], weight }))
          : item.shares,
    })),
  };
}

/** How many units of the target currency one unit of the source cost. */
export function impliedRate(
  source: { currency: string; totalCents: number },
  target: { currency: string; totalCents: number },
): number {
  const amount = ({ currency, totalCents }: typeof source) =>
    totalCents / 10 ** currencyDigits(currency);
  return amount(target) / amount(source);
}
