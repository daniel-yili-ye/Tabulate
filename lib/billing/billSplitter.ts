import type { 
  Receipt, 
  Participant, 
  ItemAllocation, 
  ComputedAllocation, 
  PersonAllocation,
  SplitType 
} from "@/lib/validation/tabSchema";

// Legacy imports for backward compatibility during migration
import { FormData } from "@/lib/validation/formSchema";

interface PersonSubtotals {
  [participantId: number]: number;
}

/**
 * Calculate how much each participant pays for an item based on split type
 */
function calculateItemSplit(
  itemPrice: number,
  allocation: ItemAllocation
): Record<number, number> {
  const { splitType, participantIds, shares, percentages, customAmounts } = allocation;
  const result: Record<number, number> = {};

  switch (splitType) {
    case "equal": {
      const splitAmount = itemPrice / participantIds.length;
      participantIds.forEach(id => {
        result[id] = splitAmount;
      });
      break;
    }

    case "shares": {
      if (!shares) {
        // Fallback to equal split if no shares provided
        const splitAmount = itemPrice / participantIds.length;
        participantIds.forEach(id => {
          result[id] = splitAmount;
        });
      } else {
        const totalShares = participantIds.reduce(
          (sum, id) => sum + (shares[id] || 1), 
          0
        );
        participantIds.forEach(id => {
          const personShares = shares[id] || 1;
          result[id] = (itemPrice * personShares) / totalShares;
        });
      }
      break;
    }

    case "percentage": {
      if (!percentages) {
        // Fallback to equal split if no percentages provided
        const splitAmount = itemPrice / participantIds.length;
        participantIds.forEach(id => {
          result[id] = splitAmount;
        });
      } else {
        participantIds.forEach(id => {
          const percentage = percentages[id] || 0;
          result[id] = (itemPrice * percentage) / 100;
        });
      }
      break;
    }

    case "custom": {
      if (!customAmounts) {
        // Fallback to equal split if no custom amounts provided
        const splitAmount = itemPrice / participantIds.length;
        participantIds.forEach(id => {
          result[id] = splitAmount;
        });
      } else {
        participantIds.forEach(id => {
          result[id] = customAmounts[id] || 0;
        });
      }
      break;
    }

    default:
      // Unknown split type, use equal split
      const splitAmount = itemPrice / participantIds.length;
      participantIds.forEach(id => {
        result[id] = splitAmount;
      });
  }

  return result;
}

/**
 * Proportionally allocate a value (tax, tip, discount) based on each person's subtotal
 */
function proportionallyAllocate(
  valueToAllocate: number,
  personIdToSubtotal: PersonSubtotals,
  participantIds: number[]
): Map<number, number> {
  const total = Object.values(personIdToSubtotal).reduce((a, b) => a + b, 0);
  const result = new Map<number, number>();

  if (total === 0) {
    const evenShare = participantIds.length === 0 ? 0 : valueToAllocate / participantIds.length;
    participantIds.forEach(id => result.set(id, evenShare));
    return result;
  }

  participantIds.forEach(id => {
    const share = (valueToAllocate * (personIdToSubtotal[id] || 0)) / total;
    result.set(id, share);
  });

  return result;
}

/**
 * NEW: Compute bill allocation from the new data structure
 */
export function computeAllocation(
  receipt: Receipt,
  participants: Participant[],
  allocations: ItemAllocation[]
): ComputedAllocation {
  const personIdToIndex: Record<number, number> = {};
  const personIdToSubtotal: PersonSubtotals = {};

  // Initialize mappings
  participants.forEach(({ id }, index) => {
    personIdToIndex[id] = index;
    personIdToSubtotal[id] = 0;
  });

  // Initialize person allocations
  const people: PersonAllocation[] = participants.map(({ id, name }) => ({
    id,
    name,
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    tip: 0,
    total: 0,
  }));

  // Process each item allocation
  allocations.forEach((allocation) => {
    const item = receipt.items[allocation.itemIndex];
    if (!item || allocation.participantIds.length === 0) return;

    const splits = calculateItemSplit(item.price, allocation);

    Object.entries(splits).forEach(([idStr, amount]) => {
      const id = parseInt(idStr, 10);
      if (personIdToIndex[id] === undefined) return;

      personIdToSubtotal[id] += amount;
      people[personIdToIndex[id]].items.push({
        item: item.item,
        price: amount,
        fullPrice: item.price,
        participants: allocation.participantIds.length,
      });
    });
  });

  // Calculate proportional tax, tip, discount
  const tax = Math.max(0, receipt.tax || 0);
  const tip = Math.max(0, receipt.tip || 0);
  const discount = Math.max(0, receipt.discount || 0);
  const participantIds = participants.map(p => p.id);

  const taxShares = proportionallyAllocate(tax, personIdToSubtotal, participantIds);
  const tipShares = proportionallyAllocate(tip, personIdToSubtotal, participantIds);
  const discountShares = proportionallyAllocate(discount, personIdToSubtotal, participantIds);

  // Finalize each person's totals
  people.forEach((person) => {
    person.subtotal = person.items.reduce((sum, item) => sum + item.price, 0);
    person.tax = taxShares.get(person.id) || 0;
    person.tip = tipShares.get(person.id) || 0;
    person.discount = discountShares.get(person.id) || 0;
    person.total = Math.max(0, person.subtotal + person.tax + person.tip - person.discount);
  });

  return {
    people,
    overallSubtotal: receipt.subtotal,
    overallTotal: receipt.total,
    totalTax: tax,
    totalTip: tip,
    totalDiscount: discount,
  };
}

// ============================================================================
// LEGACY: Keep the old splitBill function for backward compatibility
// This can be removed after migration is complete
// ============================================================================

interface LegacyBillItem {
  item: string;
  price: number;
  participantIds: number[];
}

interface LegacyBillAllocation {
  people: PersonAllocation[];
  overallTotal?: number;
  overallSubtotal?: number;
  totalTax?: number;
  totalTip?: number;
  totalDiscount?: number;
}

function legacyProportionallyAllocate(
  valueToAllocate: number,
  personIdToSubtotal: Record<number, number>,
  participantIds: number[]
): [number, number][] {
  const total = Object.values(personIdToSubtotal).reduce((a, b) => a + b, 0);

  if (total === 0) {
    const evenShare = participantIds.length === 0 ? 0 : valueToAllocate / participantIds.length;
    return participantIds.map((id) => [evenShare, id]);
  }

  return participantIds.map((id) => {
    const share = (valueToAllocate * personIdToSubtotal[id]) / total;
    return [share, id] as [number, number];
  });
}

/**
 * Split bill using the new form data structure with split types
 */
export function splitBill(formData: FormData): LegacyBillAllocation {
  const { stepItems, stepParticipants, stepAllocateItems } = formData;

  const people = stepParticipants.map((p) => ({ id: p.id, name: p.name }));
  const personIdToIndex: Record<number, number> = {};
  const personIdToSubtotal: Record<number, number> = {};

  people.forEach(({ id }, index) => {
    personIdToIndex[id] = index;
    personIdToSubtotal[id] = 0;
  });

  const allocation: LegacyBillAllocation = {
    people: people.map(({ id, name }) => ({
      id: id,
      name,
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      tip: 0,
      total: 0,
    })),
  };

  // Process each item allocation
  stepItems.Items.forEach((item, index) => {
    const itemAllocation = stepAllocateItems[index];
    if (!itemAllocation || itemAllocation.participantIds.length === 0) return;

    const itemPrice = Number(item.price) || 0;
    const itemName = item.item || "";
    const { splitType, participantIds, shares, percentages, customAmounts } = itemAllocation;

    // Calculate each participant's share based on split type
    const splits: Record<number, number> = {};
    
    switch (splitType) {
      case "equal":
        participantIds.forEach((id) => {
          splits[id] = itemPrice / participantIds.length;
        });
        break;
        
      case "shares": {
        const totalShares = participantIds.reduce(
          (sum, id) => sum + ((shares && shares[id]) || 1),
          0
        );
        participantIds.forEach((id) => {
          const personShares = (shares && shares[id]) || 1;
          splits[id] = (itemPrice * personShares) / totalShares;
        });
        break;
      }
      
      case "percentage":
        participantIds.forEach((id) => {
          const pct = (percentages && percentages[id]) || 0;
          splits[id] = (itemPrice * pct) / 100;
        });
        break;
        
      case "custom":
        participantIds.forEach((id) => {
          splits[id] = (customAmounts && customAmounts[id]) || 0;
        });
        break;
        
      default:
        // Fallback to equal split
        participantIds.forEach((id) => {
          splits[id] = itemPrice / participantIds.length;
        });
    }

    // Apply splits to allocation
    Object.entries(splits).forEach(([idStr, amount]) => {
      const id = parseInt(idStr, 10);
      if (personIdToIndex[id] === undefined) return;
      
      personIdToSubtotal[id] += amount;
      allocation.people[personIdToIndex[id]].items.push({
        item: itemName,
        price: amount,
        fullPrice: itemPrice,
        participants: participantIds.length,
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
    const shares = legacyProportionallyAllocate(value, personIdToSubtotal, participantIds);
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
