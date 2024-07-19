// utils/billSplitter.ts

import { v4 as uuidv4 } from "uuid";
import { FormData } from "../lib/formSchema";

// Helper function to convert currency to cents
const toCents = (value: number): number => Math.round(value * 100);

// Penny-Precise Allocation Algorithm
function ppaa(value: number, nrVariables: number): number[] {
  const base = Math.floor(value / nrVariables);
  const rem = value % nrVariables;
  return [...Array(rem).fill(base + 1), ...Array(nrVariables - rem).fill(base)];
}

// Proportional Penny-Precise Allocation Algorithm
function pppaa(
  value: number,
  subtotalsDict: Record<string, number>,
  peopleArr: string[]
): [number, number, string][] {
  const total = Object.values(subtotalsDict).reduce((a, b) => a + b, 0);

  // If total is zero, distribute evenly
  if (total === 0) {
    const evenShare = Math.floor(value / peopleArr.length);
    const remainder = value % peopleArr.length;
    return peopleArr.map((person, index) => [
      index < remainder ? evenShare + 1 : evenShare,
      0,
      person,
    ]);
  }

  let qrArr = peopleArr.map((person) => {
    const allocation = (value * subtotalsDict[person]) / total;
    return [
      Math.floor(allocation),
      Math.round((allocation % 1) * 100),
      person,
    ] as [number, number, string];
  });

  qrArr.sort((a, b) => b[1] - a[1]);
  const leftoverCents = value - qrArr.reduce((sum, [whole]) => sum + whole, 0);

  for (let i = 0; i < leftoverCents; i++) {
    qrArr[i][0]++;
  }

  return qrArr;
}

interface BillItem {
  item: string;
  price: number;
  participantIds: string[];
}

export interface PersonAllocation {
  id: string;
  name: string;
  items: { item: string; price: number }[];
  discount: number;
  tax: number;
  tip: number;
  subtotal: number;
}

export interface BillAllocation {
  id: string;
  billName: string;
  people: PersonAllocation[];
}

export function splitBill(formData: FormData): BillAllocation {
  const { stepOne, stepThree, stepFour, stepFive } = formData;

  // Validate total bill is not negative
  const totalBill = stepThree.foodItems.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );
  if (totalBill < 0) {
    throw new Error("Bill total cannot be negative. Please check your input.");
  }

  const billItems: BillItem[] = stepThree.foodItems.map((item, index) => ({
    item: item.item,
    price: toCents(item.price || 0),
    participantIds:
      stepFive.find((allocation) => allocation.foodItemIndex === index)
        ?.participantIds || [],
  }));

  const people = stepFour.map((p) => ({ id: p.id, name: p.name }));
  const peopleIndex: Record<string, number> = {};
  const subtotals: Record<string, number> = {};

  people.forEach(({ id, name }, index) => {
    peopleIndex[id] = index;
    subtotals[id] = 0;
  });

  const allocation: BillAllocation = {
    id: uuidv4(),
    billName: stepOne.mealName,
    people: people.map(({ id, name }) => ({
      id,
      name,
      items: [],
      discount: 0,
      tax: 0,
      tip: 0,
      subtotal: 0,
    })),
  };

  // Allocate bill items
  billItems.forEach((billItem) => {
    const splitValues = ppaa(billItem.price, billItem.participantIds.length);
    billItem.participantIds.forEach((id, i) => {
      subtotals[id] += splitValues[i];
      allocation.people[peopleIndex[id]].items.push({
        item: billItem.item,
        price: splitValues[i],
      });
    });
  });

  // Allocate discount, tax, and tip
  const discount = Math.max(0, toCents(stepThree.discount || 0));
  const tax = Math.max(0, toCents(stepThree.tax || 0));
  const tip = Math.max(0, toCents(stepThree.tip || 0));

  [
    { key: "discount", value: discount },
    { key: "tax", value: tax },
    { key: "tip", value: tip },
  ].forEach(({ key, value }) => {
    pppaa(
      value,
      subtotals,
      people.map((p) => p.id)
    ).forEach(([amount, , id]) => {
      allocation.people[peopleIndex[id]][key as "discount" | "tax" | "tip"] =
        amount;
    });
  });

  // Calculate subtotals
  allocation.people.forEach((person) => {
    const itemsTotal = person.items.reduce((sum, item) => sum + item.price, 0);
    person.subtotal = Math.max(
      0,
      itemsTotal + person.tax + person.tip - person.discount
    );
  });

  return allocation;
}
