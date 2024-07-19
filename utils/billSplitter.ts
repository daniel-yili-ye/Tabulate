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
  names: string[];
}

interface PersonAllocation {
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
    (sum, item) => sum + item.price,
    0
  );
  if (totalBill < 0) {
    throw new Error("Bill total cannot be negative. Please check your input.");
  }

  const billItems: BillItem[] = stepThree.foodItems.map((item, index) => ({
    item: item.item,
    price: toCents(item.price),
    names: stepFive
      .filter((allocation) => allocation.foodItemIndex === index)
      .flatMap((allocation) =>
        allocation.participantIndices.map((i) => stepFour[i].name)
      ),
  }));

  const people = stepFour.map((p) => p.name);
  const peopleIndex: Record<string, number> = {};
  const subtotals: Record<string, number> = {};

  people.forEach((name, index) => {
    peopleIndex[name] = index;
    subtotals[name] = 0;
  });

  const allocation: BillAllocation = {
    id: uuidv4(),
    billName: stepOne.mealName,
    people: people.map((name) => ({
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
    const splitValues = ppaa(billItem.price, billItem.names.length);
    billItem.names.forEach((name, i) => {
      subtotals[name] += splitValues[i];
      allocation.people[peopleIndex[name]].items.push({
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
    console.log(pppaa(value, subtotals, people));
    pppaa(value, subtotals, people).forEach(([amount, , name]) => {
      allocation.people[peopleIndex[name]][key as "discount" | "tax" | "tip"] =
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

  console.log(allocation);

  return allocation;
}
