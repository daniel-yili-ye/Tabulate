import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeExtraction, type Extraction } from "./extraction.ts";

const base: Extraction = {
  isReceipt: true,
  businessName: "  Corner Bistro ",
  date: "2026-03-09",
  currency: null,
  items: [
    { name: "Burger", quantity: 1, lineTotal: 14.5 },
    { name: "Beer", quantity: 3, lineTotal: 18 },
    { name: "Promo", quantity: null, lineTotal: -2 },
    { name: "", quantity: null, lineTotal: null },
    { name: "Extra sauce", quantity: 1, lineTotal: 0 },
  ],
  tax: 3.97,
  tip: null,
  discount: null,
  total: 34.47,
};

test("normalizes money to cents and folds negative lines into the discount", () => {
  assert.deepEqual(normalizeExtraction(base, "USD"), {
    businessName: "Corner Bistro",
    date: "2026-03-09",
    currency: "USD",
    currencyDetected: false,
    items: [
      { name: "Burger", priceCents: 1450 },
      { name: "3 x Beer", priceCents: 1800 },
    ],
    taxCents: 397,
    tipCents: 0,
    discountCents: 200,
    warning: null,
  });
});

test("warns when the lines do not add up to the printed total", () => {
  const parsed = normalizeExtraction({ ...base, total: 40 }, "USD");
  assert.match(parsed?.warning ?? "", /\$34\.47.*\$40\.00/);
});

test("rejects non-receipts and empty results", () => {
  assert.equal(normalizeExtraction({ ...base, isReceipt: false }, "USD"), null);
  assert.equal(normalizeExtraction({ ...base, items: [] }, "USD"), null);
});

test("drops dates that are missing or not real calendar days", () => {
  for (const date of [null, "03/09/2026", "2026-02-31"]) {
    assert.equal(normalizeExtraction({ ...base, date }, "USD")?.date, null);
  }
});

test("keeps items whose price could not be read", () => {
  const parsed = normalizeExtraction(
    {
      ...base,
      items: [{ name: "Smudged", quantity: null, lineTotal: null }],
      total: null,
    },
    "USD",
  );
  assert.deepEqual(parsed?.items, [{ name: "Smudged", priceCents: 0 }]);
});

test("uses the receipt's currency when it is recognised, the fallback otherwise", () => {
  const read = normalizeExtraction({ ...base, currency: " eur " }, "CAD");
  assert.equal(read?.currency, "EUR");
  assert.equal(read?.currencyDetected, true);

  for (const currency of [null, "", "dollars", "XXX"]) {
    const guessed = normalizeExtraction({ ...base, currency }, "CAD");
    assert.equal(guessed?.currency, "CAD");
    assert.equal(guessed?.currencyDetected, false);
  }
});

test("currencies without decimals are not multiplied into cents", () => {
  const parsed = normalizeExtraction(
    {
      ...base,
      currency: "JPY",
      items: [{ name: "Ramen", quantity: 1, lineTotal: 1200 }],
      tax: 120,
      total: 1320,
    },
    "USD",
  );
  assert.deepEqual(parsed?.items, [{ name: "Ramen", priceCents: 1200 }]);
  assert.equal(parsed?.taxCents, 120);
  assert.equal(parsed?.warning, null);
});
