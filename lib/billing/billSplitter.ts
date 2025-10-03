import { FormData } from "@/lib/validation/formSchema";
import { BillAllocation } from "@/lib/validation/allocationSchema";

interface BillItem {
  item: string;
  price: number;
  participantIds: string[];
}

function proportionallyAllocate(
  valueToAllocate: number,
  personIdToSubtotal: Record<string, number>,
  participantIds: string[]
): [number, string][] {
  const total = Object.values(personIdToSubtotal).reduce((a, b) => a + b, 0);

  if (total === 0) {
    const evenShare = participantIds.length === 0 ? 0 : valueToAllocate / participantIds.length;
    return participantIds.map((id) => [evenShare, id]);
  }

  return participantIds.map((id) => {
    const share = (valueToAllocate * personIdToSubtotal[id]) / total;
    return [share, id] as [number, string];
  });
}

export function splitBill(formData: FormData): BillAllocation {
  const { stepItems, stepParticipants, stepAllocateItems } = formData;

  const billItems: BillItem[] = stepItems.Items.map((item, index) => ({
    item: item.item || "",
    price: Number(item.price) || 0,
    participantIds: stepAllocateItems.find((_, i) => i === index) || [],
  }));

  const people = stepParticipants.map((p) => ({ id: p.id, name: p.name }));
  const personIdToIndex: Record<string, number> = {};
  const personIdToSubtotal: Record<string, number> = {};

  people.forEach(({ id }, index) => {
    personIdToIndex[id] = index;
    personIdToSubtotal[id] = 0;
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

  billItems.forEach((billItem) => {
    if (billItem.participantIds.length === 0) return;
    const splitValues = billItem.price / billItem.participantIds.length;
    billItem.participantIds.forEach((id) => {
      personIdToSubtotal[id] += splitValues;
      allocation.people[personIdToIndex[id]].items.push({
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

  const proportionalKeys = [
    { key: "tax", value: tax },
    { key: "tip", value: tip },
    { key: "discount", value: discount },
  ] as const;

  const participantIds = people.map((p) => p.id);

  proportionalKeys.forEach(({ key, value }) => {
    const shares = proportionallyAllocate(value, personIdToSubtotal, participantIds);
    shares.forEach(([amount, id]) => {
      allocation.people[personIdToIndex[id]][key] = amount as number;
    });
  });

  allocation.people.forEach((person) => {
    person.subtotal = person.items.reduce((sum, item) => sum + item.price, 0);
    person.total = Math.max(0, person.subtotal + person.tax + person.tip - person.discount);
  });

  return allocation;
}
