import type { CurrencyCode } from "../tabs/currency.ts";
import type {
  SharedTab,
  SplitType,
  TabDraft,
  TabItem,
  TabParticipant,
} from "../tabs/schema.ts";
import { allocate, defaultWeights } from "../tabs/split.ts";

export function newItem(values: Partial<Omit<TabItem, "id">> = {}): TabItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    priceCents: 0,
    splitType: "equal",
    shares: [],
    ...values,
  };
}

export function newParticipant(): TabParticipant {
  return { id: crypto.randomUUID(), name: "" };
}

/**
 * A blank tab, starting with the user's default payment note and currency.
 * The date is filled in on the client, in the user's time zone.
 */
export function emptyDraft(paymentMessage: string, currency: CurrencyCode): TabDraft {
  return {
    businessName: "",
    date: "",
    currency,
    taxCents: 0,
    tipCents: 0,
    discountCents: 0,
    receiptImagePath: null,
    paymentMessage,
    participants: [newParticipant(), newParticipant()],
    items: [newItem()],
  };
}

export function draftFromTab(tab: SharedTab): TabDraft {
  return {
    businessName: tab.businessName,
    date: tab.date,
    currency: tab.currency,
    taxCents: tab.taxCents,
    tipCents: tab.tipCents,
    discountCents: tab.discountCents,
    receiptImagePath: tab.receiptImagePath,
    paymentMessage: tab.paymentMessage,
    participants: tab.participants,
    items: tab.items,
  };
}

/**
 * Set who shares an item. Equal and share-based splits keep existing weights;
 * percentage and custom splits are rebalanced evenly so they always add up.
 */
export function withSharers(item: TabItem, participantIds: string[]): TabItem {
  const current = new Map(item.shares.map((s) => [s.participantId, s.weight]));
  const rebalance = item.splitType === "percentage" || item.splitType === "custom";
  const defaults = defaultWeights(item.splitType, item.priceCents, participantIds.length);

  return {
    ...item,
    shares: participantIds.map((participantId, index) => ({
      participantId,
      weight: rebalance ? defaults[index] : (current.get(participantId) ?? 1),
    })),
  };
}

export function withSplitType(item: TabItem, splitType: SplitType): TabItem {
  const defaults = defaultWeights(splitType, item.priceCents, item.shares.length);
  return {
    ...item,
    splitType,
    shares: item.shares.map((share, index) => ({ ...share, weight: defaults[index] })),
  };
}

export function withWeight(item: TabItem, participantId: string, weight: number): TabItem {
  return {
    ...item,
    shares: item.shares.map((share) =>
      share.participantId === participantId ? { ...share, weight } : share,
    ),
  };
}

/** Replace one item with `count` equal parts, e.g. a shared bottle into glasses. */
export function splitItemInto(item: TabItem, count: number): TabItem[] {
  return allocate(item.priceCents, Array.from({ length: count }, () => 1)).map(
    (priceCents) => newItem({ name: item.name, priceCents }),
  );
}

/** `count` extra copies of an item, keeping who it was assigned to. */
export function duplicateItem(item: TabItem, count: number): TabItem[] {
  const { name, priceCents, splitType, shares } = item;
  return Array.from({ length: count }, () =>
    newItem({ name, priceCents, splitType, shares }),
  );
}

/** Drop a person from every item they were sharing. */
export function withoutParticipant(items: TabItem[], participantId: string): TabItem[] {
  return items.map((item) =>
    item.shares.some((share) => share.participantId === participantId)
      ? withSharers(
          item,
          item.shares
            .map((share) => share.participantId)
            .filter((id) => id !== participantId),
        )
      : item,
  );
}
