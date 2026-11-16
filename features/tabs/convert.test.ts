import assert from "node:assert/strict";
import { test } from "node:test";
import { convertTab, impliedRate } from "./convert.ts";
import { computeSplit, type SplitInput } from "./split.ts";

const [ana, ben, cal] = ["a", "b", "c"];

const dinner: SplitInput = {
  taxCents: 1000,
  tipCents: 1500,
  discountCents: 500,
  participants: [
    { id: ana, name: "Ana" },
    { id: ben, name: "Ben" },
    { id: cal, name: "Cal" },
  ],
  items: [
    {
      name: "Pasta",
      priceCents: 1850,
      splitType: "equal",
      shares: [{ participantId: ana, weight: 1 }],
    },
    {
      name: "Wine",
      priceCents: 4200,
      splitType: "equal",
      shares: [ana, ben, cal].map((participantId) => ({ participantId, weight: 1 })),
    },
    {
      name: "Steak",
      priceCents: 3333,
      splitType: "custom",
      shares: [
        { participantId: ben, weight: 2000 },
        { participantId: cal, weight: 1333 },
      ],
    },
  ],
};

test("a converted tab and its split add up to exactly what was charged", () => {
  // 113.83 EUR charged as 184.79 CAD.
  const charged = 18479;
  const converted = convertTab(dinner, charged);
  const split = computeSplit(converted);

  assert.equal(split.totalCents, charged);
  assert.equal(split.unassignedCents, 0);
  assert.equal(
    split.people.reduce((sum, person) => sum + person.totalCents, 0),
    charged,
  );
});

test("conversion keeps everyone's share of the tab", () => {
  const before = computeSplit(dinner);
  const after = computeSplit(convertTab(dinner, 18479));
  const rate = 18479 / before.totalCents;

  before.people.forEach((person, index) => {
    const exact = person.totalCents * rate;
    assert.ok(Math.abs(after.people[index].totalCents - exact) <= 2);
  });
});

test("custom amounts are scaled with their item", () => {
  const steak = convertTab(dinner, 18479).items[2];
  assert.equal(
    steak.shares.reduce((sum, share) => sum + share.weight, 0),
    steak.priceCents,
  );
});

test("a tab with nothing on it is left alone", () => {
  const empty: SplitInput = { ...dinner, items: [], taxCents: 0, tipCents: 0, discountCents: 0 };
  assert.equal(convertTab(empty, 5000), empty);
});

test("the implied rate accounts for currencies without decimals", () => {
  // 100.00 EUR charged as 16,000 JPY.
  const rate = impliedRate(
    { currency: "EUR", totalCents: 10000 },
    { currency: "JPY", totalCents: 16000 },
  );
  assert.equal(rate, 160);
});
