import assert from "node:assert/strict";
import { test } from "node:test";
import { allocate, computeSplit, splitItem, type SplitInput } from "./split.ts";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const spread = (values: number[]) => Math.max(...values) - Math.min(...values);

const people = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `Person ${i}` }));

const everyone = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ participantId: `p${i}`, weight: 1 }));

/** Every row and column of the result must add up exactly. */
function assertReconciles(tab: SplitInput) {
  const result = computeSplit(tab);
  const assigned = result.subtotalCents - result.unassignedCents;

  assert.equal(sum(result.people.map((p) => p.subtotalCents)), assigned);
  assert.equal(sum(result.people.map((p) => p.taxCents)), tab.taxCents);
  assert.equal(sum(result.people.map((p) => p.tipCents)), tab.tipCents);
  assert.equal(sum(result.people.map((p) => p.discountCents)), tab.discountCents);
  assert.equal(
    sum(result.people.map((p) => p.totalCents)),
    assigned + tab.taxCents + tab.tipCents - tab.discountCents,
  );

  for (const person of result.people) {
    assert.equal(sum(person.items.map((item) => item.cents)), person.subtotalCents);
    assert.equal(
      person.subtotalCents + person.taxCents + person.tipCents - person.discountCents,
      person.totalCents,
    );
    for (const value of [
      person.subtotalCents,
      person.taxCents,
      person.tipCents,
      person.discountCents,
      ...person.items.map((item) => item.cents),
    ]) {
      assert.ok(value >= 0, `negative amount ${value}`);
    }
  }
  return result;
}

test("allocate always adds up to the total", () => {
  assert.deepEqual(allocate(1000, [1, 1, 1]), [334, 333, 333]);
  assert.deepEqual(allocate(100, [50, 30, 20]), [50, 30, 20]);
  assert.deepEqual(allocate(0, [1, 2]), [0, 0]);
  assert.deepEqual(allocate(5, []), []);
  assert.deepEqual(allocate(300, [0, 0, 0]), [100, 100, 100]);
  for (const total of [1, 7, 99, 1001, 123457]) {
    for (const weights of [[1, 1], [3, 1, 1], [33, 33, 34], [1, 2, 3, 4, 5, 6, 7]]) {
      assert.equal(sum(allocate(total, weights)), total);
    }
  }
});

test("a meal shared equally never leaves people more than a cent apart", () => {
  // Rounding each of these items on its own would hand out 1 or 2 odd cents
  // per item, and three more for tax, tip and discount.
  const prices = [1000, 1700, 2350, 895, 1495, 725, 3100, 1250, 499, 2005, 1111];
  for (const count of [2, 3, 4, 6, 7]) {
    const result = assertReconciles({
      taxCents: 2113,
      tipCents: 3200,
      discountCents: 501,
      participants: people(count),
      items: prices.map((priceCents, i) => ({
        name: `Item ${i}`,
        priceCents,
        splitType: "equal" as const,
        shares: everyone(count),
      })),
    });
    assert.ok(spread(result.people.map((p) => p.totalCents)) <= 1);
    assert.ok(spread(result.people.map((p) => p.subtotalCents)) <= 1);
  }
});

test("people with identical shares pay the same, whatever others had", () => {
  const result = assertReconciles({
    taxCents: 1300,
    tipCents: 1801,
    discountCents: 0,
    participants: people(4),
    items: [
      { name: "Pizza", priceCents: 2500, splitType: "equal", shares: everyone(3) },
      { name: "Wings", priceCents: 1399, splitType: "equal", shares: everyone(3) },
      { name: "Nachos", priceCents: 1601, splitType: "equal", shares: everyone(3) },
      {
        name: "Steak",
        priceCents: 4200,
        splitType: "equal",
        shares: [{ participantId: "p3", weight: 1 }],
      },
    ],
  });
  assert.ok(spread(result.people.slice(0, 3).map((p) => p.totalCents)) <= 1);
});

const mixed: SplitInput = {
  taxCents: 1300,
  tipCents: 1801,
  discountCents: 500,
  participants: [
    { id: "a", name: "Ana" },
    { id: "b", name: "Ben" },
    { id: "c", name: "Cy" },
  ],
  items: [
    {
      name: "Pizza",
      priceCents: 2500,
      splitType: "equal",
      shares: [
        { participantId: "a", weight: 1 },
        { participantId: "b", weight: 1 },
        { participantId: "c", weight: 1 },
      ],
    },
    {
      name: "Wine",
      priceCents: 4000,
      splitType: "shares",
      shares: [
        { participantId: "a", weight: 2 },
        { participantId: "b", weight: 1 },
      ],
    },
    {
      name: "Dessert",
      priceCents: 1200,
      splitType: "percentage",
      shares: [
        { participantId: "b", weight: 75 },
        { participantId: "c", weight: 25 },
      ],
    },
    {
      name: "Coffee",
      priceCents: 900,
      splitType: "custom",
      shares: [
        { participantId: "a", weight: 400 },
        { participantId: "c", weight: 500 },
      ],
    },
    { name: "Unclaimed", priceCents: 300, splitType: "equal", shares: [] },
  ],
};

test("mixed split types reconcile and round each person once", () => {
  const result = assertReconciles(mixed);
  assert.equal(result.subtotalCents, 8900);
  assert.equal(result.unassignedCents, 300);
  // Exact shares: Ana 3900, Ben 3066.67, Cy 1633.33.
  assert.deepEqual(
    result.people.map((p) => p.subtotalCents),
    [3900, 3067, 1633],
  );
  // Exact amounts are shown exactly.
  const coffee = result.people.map((p) => p.items.find((i) => i.name === "Coffee")?.cents);
  assert.deepEqual(coffee, [400, undefined, 500]);
});

test("exact amounts stay exact even when a person is rounded down", () => {
  const penny = (name: string) => ({
    name,
    priceCents: 1,
    splitType: "equal" as const,
    shares: everyone(3),
  });
  const result = assertReconciles({
    taxCents: 0,
    tipCents: 0,
    discountCents: 0,
    participants: people(3),
    items: [
      penny("Mint"),
      penny("Candy"),
      {
        name: "Steak",
        priceCents: 3000,
        splitType: "custom",
        shares: everyone(3).map((share) => ({ ...share, weight: 1000 })),
      },
    ],
  });
  for (const person of result.people) {
    assert.equal(person.items.find((item) => item.name === "Steak")?.cents, 1000);
  }
});

test("ignores shares for people who are not on the tab", () => {
  const result = assertReconciles({
    ...mixed,
    taxCents: 0,
    tipCents: 0,
    discountCents: 0,
    items: [
      {
        name: "Ghost",
        priceCents: 1000,
        splitType: "equal",
        shares: [{ participantId: "zzz", weight: 1 }],
      },
    ],
  });
  assert.equal(result.unassignedCents, 1000);
  assert.equal(sum(result.people.map((p) => p.totalCents)), 0);
});

test("tax and tip are split evenly when nobody has items yet", () => {
  const result = assertReconciles({ ...mixed, discountCents: 0, items: [] });
  assert.deepEqual(
    result.people.map((p) => p.totalCents),
    [1034, 1034, 1033],
  );
});

test("splitItem previews one item on its own", () => {
  assert.deepEqual(splitItem(mixed.items[0]), [834, 833, 833]);
  assert.deepEqual(splitItem(mixed.items[1]), [2667, 1333]);
  assert.deepEqual(splitItem(mixed.items[3]), [400, 500]);
});

test("random tabs always reconcile, including tiny shares", () => {
  // Small deterministic generator so failures are reproducible.
  let seed = 42;
  const random = (max: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % max;
  };

  for (let round = 0; round < 500; round++) {
    const count = 2 + random(6);
    const participants = people(count);
    const items = Array.from({ length: 1 + random(8) }, (_, i) => {
      const priceCents = random(10) === 0 ? random(5) : random(6000);
      const sharers = participants.filter(() => random(3) > 0);
      const splitType = (["equal", "shares", "percentage"] as const)[random(3)];
      const percents = allocate(100, sharers.map(() => 1 + random(9)));
      return {
        name: `Item ${i}`,
        priceCents,
        splitType,
        shares: sharers.map((p, position) => ({
          participantId: p.id,
          weight: splitType === "percentage" ? percents[position] : 1 + random(4),
        })),
      };
    });
    const subtotal = sum(items.map((item) => item.priceCents));
    assertReconciles({
      participants,
      items,
      taxCents: random(900),
      tipCents: random(3) === 0 ? 0 : random(2000),
      discountCents: random(4) === 0 ? random(subtotal + 1) : 0,
    });
  }
});
