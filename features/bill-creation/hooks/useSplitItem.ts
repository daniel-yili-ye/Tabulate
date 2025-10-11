import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormData } from "@/lib/validation/formSchema";

export function useSplitItem() {
  const { getValues, setValue } = useFormContext<FormData>();
  const [splitDrawerOpen, setSplitDrawerOpen] = useState(false);
  const [currentSplitItem, setCurrentSplitItem] = useState<{ index: number; item: string; price: number } | null>(null);
  const [splitCount, setSplitCount] = useState<number>(2);

  const openSplitForIndex = (index: number) => {
    const currentItems = getValues("stepItems.Items");
    const itemToSplit = currentItems[index];
    setCurrentSplitItem({ index, item: itemToSplit?.item || "", price: Number(itemToSplit?.price) || 0 });
    setSplitDrawerOpen(true);
  };

  const confirmSplit = () => {
    if (!currentSplitItem || splitCount < 2) return;

    const { index, item, price } = currentSplitItem;

    const totalCents = Math.round(price * 100);
    const baseCents = Math.floor(totalCents / splitCount);
    const remainderCents = totalCents % splitCount;

    const splitAmounts = Array(splitCount).fill(baseCents);
    for (let i = 0; i < remainderCents; i++) splitAmounts[i] += 1;
    const splitPrices = splitAmounts.map((cents) => cents / 100);

    const currentItems = getValues("stepItems.Items");
    const currentAllocations = getValues("stepAllocateItems");
    const normalizedAllocations = currentItems.map((_, i) => (currentAllocations?.[i] || []));

    const newItems = [...currentItems];
    newItems[index] = { item, price: splitPrices[0] } as any;
    for (let i = 1; i < splitCount; i++) {
      newItems.splice(index + i, 0, { item, price: splitPrices[i] } as any);
    }
    setValue("stepItems.Items", newItems as Array<{ item: string; price: number }>);

    const newAllocations = [
      ...normalizedAllocations.slice(0, index),
      ...Array(splitCount).fill([]),
      ...normalizedAllocations.slice(index + 1),
    ];

    setValue("stepAllocateItems", newAllocations);

    setSplitDrawerOpen(false);
    setCurrentSplitItem(null);
    setSplitCount(2);
  };

  return {
    splitDrawerOpen,
    currentSplitItem,
    splitCount,
    setSplitCount,
    setSplitDrawerOpen,
    openSplitForIndex,
    confirmSplit,
  };
}

