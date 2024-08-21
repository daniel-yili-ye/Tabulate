// utils/billSplitter.ts

import { v4 as uuidv4 } from "uuid";
import { FormData } from "../lib/formSchema";

interface BillItem {
  item: string;
  price: number;
  participantIds: string[];
}

export interface PersonAllocation {
  id: string;
  name: string;
  items: { item: string; price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
}

export interface BillAllocation {
  billName: string;
  people: PersonAllocation[];
}

// Proportional Allocation Algorithm
function paa(
  value: number, // value you want to split
  subtotalsDict: Record<string, number>, // people and their subtotals
  peopleArr: string[] // [id, ...]
): [number, string][] {
  // calculate denominator
  const total = Object.values(subtotalsDict).reduce((a, b) => a + b, 0);

  // If total is zero, distribute evenly
  if (total === 0) {
    const allocation = value / peopleArr.length;
    return peopleArr.map((person, index) => [allocation, person]);
  }

  let qrArr = peopleArr.map((person) => {
    const allocation = (value * subtotalsDict[person]) / total;
    return [allocation, person] as [number, string];
  });

  return qrArr;
}

export function splitBill(formData: FormData): BillAllocation {
  const { stepOne, stepThree, stepFour, stepFive } = formData;

  const billItems: BillItem[] = stepThree.foodItems.map((item, index) => ({
    item: item.item,
    price: item.price || 0,
    participantIds: stepFive.find((_, index2) => index2 === index) || [],
  }));

  const people = stepFour.map((p) => ({ id: p.id, name: p.name }));
  const peopleIndex: Record<string, number> = {};
  const subtotals: Record<string, number> = {};

  people.forEach(({ id, name }, index) => {
    peopleIndex[id] = index;
    subtotals[id] = 0;
  });

  const allocation: BillAllocation = {
    billName: stepOne.mealName,
    people: people.map(({ id, name }) => ({
      id,
      name,
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      tip: 0,
      total: 0,
    })),
  };

  // Allocate bill items
  billItems.forEach((billItem) => {
    const splitValues = billItem.price / billItem.participantIds.length;
    billItem.participantIds.forEach((id) => {
      subtotals[id] += splitValues;
      allocation.people[peopleIndex[id]].items.push({
        item: billItem.item,
        price: splitValues,
      });
    });
  });

  const subtotal = stepThree.foodItems.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );
  const tax = Math.max(0, stepThree.tax || 0);
  const tip = Math.max(0, stepThree.tip || 0);
  const discount = Math.max(0, stepThree.discount || 0);
  const total = subtotal + tax + tip - discount;

  const ttd = [
    { key: "tax", value: tax },
    { key: "tip", value: tip },
    { key: "discount", value: discount },
  ];

  const peopleID = people.map((p) => p.id);

  // iterate through each key and assign proprotional value to each person
  ttd.forEach(({ key, value }) => {
    // value = value you want to split
    // subtotals = subtotal for each person
    // peopleID = id of people
    const paaArr = paa(value, subtotals, peopleID); // [number, string][]
    paaArr.forEach(([amount, id]) => {
      allocation.people[peopleIndex[id]][key as "discount" | "tax" | "tip"] =
        amount;
    });
  });

  // Calculate subtotals
  allocation.people.forEach((person) => {
    person.subtotal = person.items.reduce((sum, item) => sum + item.price, 0); // can be decimal
    person.total = Math.max(
      0,
      person.subtotal + person.tax + person.tip - person.discount
    );
  });

  return allocation;
}
