// utils/billSplitter.ts
import { FormData } from "../schema/formSchema";
import { BillAllocation } from "@/schema/allocationSchema";

interface BillItem {
  item: string;
  price: number;
  participantIds: string[];
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
  const { stepItems, stepParticipants, stepAllocateItems } = formData;

  const billItems: BillItem[] = stepItems.Items.map((item, index) => ({
    item: item.item,
    price: Number(item.price) || 0,
    participantIds:
      stepAllocateItems.find((_, index2) => index2 === index) || [],
  }));

  const people = stepParticipants.map((p) => ({ id: p.id, name: p.name }));
  const peopleIndex: Record<string, number> = {};
  const subtotals: Record<string, number> = {};

  people.forEach(({ id, name }, index) => {
    peopleIndex[id] = index;
    subtotals[id] = 0;
  });

  const allocation: BillAllocation = {
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
        fullPrice: billItem.price,
        participants: billItem.participantIds.length,
      });
    });
  });

  const tax = Math.max(0, stepItems.tax || 0);
  const tip = Math.max(0, stepItems.tip || 0);
  const discount = Math.max(0, stepItems.discount || 0);

  const ttd = [
    { key: "tax", value: tax },
    { key: "tip", value: tip },
    { key: "discount", value: discount },
  ];

  const peopleID = people.map((p) => p.id);

  // iterate through each key and assign proportional value to each person
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
