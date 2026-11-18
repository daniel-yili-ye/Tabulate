import assert from "node:assert/strict";
import { test } from "node:test";
import { shareNote } from "./share-note.ts";
import { computeSplit, type SplitInput } from "./split.ts";

const tab: SplitInput = {
  taxCents: 0,
  tipCents: 0,
  discountCents: 0,
  participants: [
    { id: "a", name: "Ana" },
    { id: "b", name: "Ben" },
    { id: "c", name: "Cy" },
  ],
  items: [
    { name: "Steak", priceCents: 4200, splitType: "equal", shares: [{ participantId: "a", weight: 1 }] },
    {
      name: "Pizza",
      priceCents: 2400,
      splitType: "equal",
      shares: ["a", "b", "c"].map((participantId) => ({ participantId, weight: 1 })),
    },
    {
      name: "Wine",
      priceCents: 4800,
      splitType: "shares",
      shares: [
        { participantId: "a", weight: 2 },
        { participantId: "b", weight: 3 },
      ],
    },
    {
      name: "Nachos",
      priceCents: 1500,
      splitType: "percentage",
      shares: [
        { participantId: "a", weight: 40 },
        { participantId: "b", weight: 60 },
      ],
    },
    {
      name: "Dessert",
      priceCents: 1200,
      splitType: "custom",
      shares: [
        { participantId: "a", weight: 500 },
        { participantId: "b", weight: 700 },
      ],
    },
  ],
};

test("explains how each shared item was divided", () => {
  const [ana, ben] = computeSplit(tab).people;
  assert.deepEqual(
    ana.items.map((item) => shareNote(item, "USD")),
    [
      null,
      "1/3 of $24.00, split equally",
      "2 of 5 shares of $48.00",
      "40% of $15.00",
      "Set amount, out of $12.00",
    ],
  );
  assert.equal(shareNote(ben.items[1], "USD"), "3 of 5 shares of $48.00");
});

test("counts only the sharers who are still on the tab", () => {
  const gone = { ...tab, participants: tab.participants.slice(0, 2) };
  const [ana] = computeSplit(gone).people;
  assert.equal(shareNote(ana.items[1], "USD"), "1/2 of $24.00, split equally");
});
