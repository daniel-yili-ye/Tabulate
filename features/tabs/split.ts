import type { SplitType } from "./schema.ts";

/** The parts of a tab the split maths needs. Satisfied by drafts and saved tabs. */
export interface SplitInput {
  taxCents: number;
  tipCents: number;
  discountCents: number;
  participants: { id: string; name: string }[];
  items: {
    name: string;
    priceCents: number;
    splitType: SplitType;
    shares: { participantId: string; weight: number }[];
  }[];
}

export interface PersonItem {
  name: string;
  /** This person's part of the item. */
  cents: number;
  /** The item's full price. */
  priceCents: number;
  sharedBy: number;
  /** How the item was divided between its sharers. */
  splitType: SplitType;
  /** This person's shares, percent or cents, depending on `splitType`. */
  weight: number;
  /** The sum of every sharer's weight. */
  weightTotal: number;
}

export interface PersonSplit {
  id: string;
  name: string;
  items: PersonItem[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  discountCents: number;
  totalCents: number;
}

export interface SplitResult {
  people: PersonSplit[];
  /** Sum of every item, assigned or not. */
  subtotalCents: number;
  /** Sum of the items nobody has been assigned to yet. */
  unassignedCents: number;
  totalCents: number;
}

/**
 * Divide `totalCents` in proportion to `weights` so that the parts are whole
 * cents and add up to exactly `totalCents` (largest remainder method). Each
 * part is the exact share rounded down or up, so equal weights never end up
 * more than one cent apart. Ties go to the earliest position.
 */
export function allocate(totalCents: number, weights: readonly (number | bigint)[]): number[] {
  const count = weights.length;
  if (count === 0) return [];
  // A discount can outweigh what has been assigned so far while a tab is being
  // edited. Split what is owed back the same way.
  if (totalCents < 0) return allocate(-totalCents, weights).map((part) => -part);

  let exact = weights.map((weight) => BigInt(weight));
  let weightSum = exact.reduce((sum, weight) => sum + weight, 0n);
  if (weightSum === 0n) {
    // Nothing to weigh by: fall back to an even split.
    exact = exact.map(() => 1n);
    weightSum = BigInt(count);
  }

  const total = BigInt(totalCents);
  const parts = exact.map((weight) => Number((total * weight) / weightSum));
  let leftover = totalCents - parts.reduce((sum, part) => sum + part, 0);

  const order = exact
    .map((weight, index) => ({ index, remainder: (total * weight) % weightSum }))
    .sort((a, b) =>
      a.remainder === b.remainder
        ? a.index - b.index
        : a.remainder > b.remainder
          ? -1
          : 1,
    );

  for (let i = 0; leftover > 0; i = (i + 1) % count, leftover--) {
    parts[order[i].index]++;
  }
  return parts;
}

/**
 * One item divided on its own, in the same order as `item.shares`. Used for
 * the per-item preview while assigning; the final split is rounded once per
 * person instead (see computeSplit).
 */
export function splitItem(item: SplitInput["items"][number]): number[] {
  if (item.splitType === "custom") return item.shares.map((share) => share.weight);
  return allocate(
    item.priceCents,
    item.shares.map((share) => (item.splitType === "equal" ? 1 : share.weight)),
  );
}

// --- Exact fractions -------------------------------------------------------

/** A non-negative amount of cents as numerator / denominator. */
interface Fraction {
  n: bigint;
  d: bigint;
}

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

function add(a: Fraction, b: Fraction): Fraction {
  const n = a.n * b.d + b.n * a.d;
  const d = a.d * b.d;
  const divisor = gcd(n, d) || 1n;
  return { n: n / divisor, d: d / divisor };
}

/** Whole-number weights in the same proportions as the fractions. */
function toWeights(fractions: Fraction[]): bigint[] {
  const common = fractions.reduce((lcm, f) => (lcm / gcd(lcm, f.d)) * f.d, 1n);
  return fractions.map((f) => f.n * (common / f.d));
}

/** Each sharer's exact, unrounded part of an item. */
function exactShares(item: SplitInput["items"][number]): Fraction[] {
  if (item.splitType === "custom") {
    return item.shares.map((share) => ({ n: BigInt(share.weight), d: 1n }));
  }
  const weights = item.shares.map((share) =>
    BigInt(item.splitType === "equal" ? 1 : share.weight),
  );
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0n);
  const price = BigInt(item.priceCents);
  return weights.map((weight) =>
    weightSum === 0n
      ? { n: price, d: BigInt(weights.length) }
      : { n: price * weight, d: weightSum },
  );
}

// --- The split -------------------------------------------------------------

interface Line {
  name: string;
  priceCents: number;
  sharedBy: number;
  splitType: SplitType;
  weight: number;
  weightTotal: number;
  exact: Fraction;
}

/**
 * Work out what everyone owes.
 *
 * Rounding each item separately lets odd cents pile up, so people who shared
 * everything equally could end up several cents apart. Instead, everyone's
 * share of the items is added up exactly, as fractions, and rounding happens
 * once per person:
 *
 * 1. Each person's items subtotal is their exact share, rounded.
 * 2. Each person's total is their exact share of the whole bill, rounded.
 *    Tax, tip and discount are proportional to the items, so the whole bill
 *    is divided in the same proportions as the items.
 * 3. Tax, tip and discount are then fitted so that every person's lines add
 *    up to their total and every column adds up to the receipt.
 *
 * People with identical shares therefore never differ by more than one cent,
 * and every total reconciles exactly.
 */
export function computeSplit(tab: SplitInput): SplitResult {
  const index = new Map(tab.participants.map((p, position) => [p.id, position]));
  const lines: Line[][] = tab.participants.map(() => []);

  let subtotalCents = 0;
  let unassignedCents = 0;

  tab.items.forEach((item, itemIndex) => {
    subtotalCents += item.priceCents;
    const shares = item.shares.filter((share) => index.has(share.participantId));
    if (shares.length === 0) {
      unassignedCents += item.priceCents;
      return;
    }
    const exact = exactShares({ ...item, shares });
    const weightTotal = shares.reduce((sum, share) => sum + share.weight, 0);
    shares.forEach((share, position) => {
      lines[index.get(share.participantId)!].push({
        name: item.name || `Item ${itemIndex + 1}`,
        priceCents: item.priceCents,
        sharedBy: shares.length,
        splitType: item.splitType,
        weight: share.weight,
        weightTotal,
        exact: exact[position],
      });
    });
  });

  const assignedCents = subtotalCents - unassignedCents;
  const { taxCents, tipCents, discountCents } = tab;

  // Everyone's exact share of the items, as whole-number weights.
  const weights = toWeights(
    lines.map((personLines) =>
      personLines.reduce((sum, line) => add(sum, line.exact), { n: 0n, d: 1n }),
    ),
  );

  const subtotals = allocate(assignedCents, weights);
  const charges = fitCharges(
    { taxCents, tipCents, discountCents },
    subtotals,
    allocate(assignedCents + taxCents + tipCents - discountCents, weights),
    weights,
  );

  const people = tab.participants.map((participant, position): PersonSplit => {
    const personLines = lines[position];
    const amounts = lineAmounts(personLines, subtotals[position]);
    const charge = charges[position];

    return {
      id: participant.id,
      name: participant.name,
      items: personLines.map((line, lineIndex) => ({
        name: line.name,
        cents: amounts[lineIndex],
        priceCents: line.priceCents,
        sharedBy: line.sharedBy,
        splitType: line.splitType,
        weight: line.weight,
        weightTotal: line.weightTotal,
      })),
      subtotalCents: subtotals[position],
      ...charge,
      totalCents:
        subtotals[position] + charge.taxCents + charge.tipCents - charge.discountCents,
    };
  });

  return {
    people,
    subtotalCents,
    unassignedCents,
    totalCents: subtotalCents + taxCents + tipCents - discountCents,
  };
}

/**
 * One person's item lines, adding up to their rounded subtotal. Lines that are
 * already whole cents (exact amounts, or shares that divide evenly) are shown
 * as they are; only the lines with a fraction of a cent share the rounding.
 */
function lineAmounts(personLines: Line[], subtotalCents: number): number[] {
  const isWhole = (line: Line) => line.exact.n % line.exact.d === 0n;
  const amounts = personLines.map((line) =>
    isWhole(line) ? Number(line.exact.n / line.exact.d) : 0,
  );
  const fractional = personLines.flatMap((line, i) => (isWhole(line) ? [] : [i]));
  const rest = subtotalCents - amounts.reduce((sum, cents) => sum + cents, 0);
  allocate(rest, toWeights(fractional.map((i) => personLines[i].exact))).forEach(
    (cents, k) => (amounts[fractional[k]] = cents),
  );
  return amounts;
}

type Charges = Pick<PersonSplit, "taxCents" | "tipCents" | "discountCents">;
type ChargeKey = keyof Charges;

/**
 * Give everyone their tax, tip and discount so that each person lands exactly
 * on their fairly rounded total. Two of the three are rounded directly; the
 * largest one absorbs the remaining cent so the rows add up.
 */
function fitCharges(
  receipt: Charges,
  subtotals: number[],
  totals: number[],
  weights: bigint[],
): Charges[] {
  const direct: Record<ChargeKey, number[]> = {
    taxCents: allocate(receipt.taxCents, weights),
    tipCents: allocate(receipt.tipCents, weights),
    discountCents: allocate(receipt.discountCents, weights),
  };
  const independent = subtotals.map((_, p) => ({
    taxCents: direct.taxCents[p],
    tipCents: direct.tipCents[p],
    discountCents: direct.discountCents[p],
  }));

  const keys: ChargeKey[] = ["tipCents", "taxCents", "discountCents"];
  const absorber = keys.reduce((a, b) => (receipt[b] > receipt[a] ? b : a));
  if (receipt[absorber] === 0) return independent;

  const fitted = independent.map((charge, p) => {
    // total = subtotal + tax + tip - discount, solved for the absorbing line.
    const others =
      (absorber === "taxCents" ? 0 : charge.taxCents) +
      (absorber === "tipCents" ? 0 : charge.tipCents) -
      (absorber === "discountCents" ? 0 : charge.discountCents);
    const gap = totals[p] - subtotals[p] - others;
    return { ...charge, [absorber]: absorber === "discountCents" ? -gap : gap };
  });

  // With a share of well under a cent the absorbing line could come out
  // negative. Rounding each line on its own is always valid, so use that.
  return fitted.some((charge) => charge[absorber] < 0) ? independent : fitted;
}

/** Sensible starting weights when an item's split type or sharers change. */
export function defaultWeights(
  splitType: SplitType,
  priceCents: number,
  count: number,
): number[] {
  const even = Array.from({ length: count }, () => 1);
  switch (splitType) {
    case "equal":
    case "shares":
      return even;
    case "percentage":
      return allocate(100, even);
    case "custom":
      return allocate(priceCents, even);
  }
}
