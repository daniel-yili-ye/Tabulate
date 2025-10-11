import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FormData } from "@/lib/validation/formSchema";

export function useDuplicateItem() {
  const { getValues, setValue } = useFormContext<FormData>();
  const [duplicateDrawerOpen, setDuplicateDrawerOpen] = useState(false);
  const [currentDuplicateItem, setCurrentDuplicateItem] = useState<{
    index: number;
    item: string;
    price: number;
  } | null>(null);
  const [duplicateCount, setDuplicateCount] = useState<number>(1);

  const openDuplicateForIndex = (index: number) => {
    const currentItems = getValues("stepItems.Items");
    const itemToDuplicate = currentItems[index];
    setCurrentDuplicateItem({
      index,
      item: itemToDuplicate?.item || "",
      price: Number(itemToDuplicate?.price) || 0,
    });
    setDuplicateDrawerOpen(true);
  };

  const confirmDuplicate = () => {
    if (!currentDuplicateItem || duplicateCount < 1) return;

    const { index, item, price } = currentDuplicateItem;

    const currentItems = getValues("stepItems.Items");
    const currentAllocations = getValues("stepAllocateItems");
    const normalizedAllocations = currentItems.map(
      (_, i) => currentAllocations?.[i] || []
    );

    // Create duplicate items with the same price
    const newItems = [...currentItems];
    for (let i = 0; i < duplicateCount; i++) {
      newItems.splice(index + 1 + i, 0, { item, price } as any);
    }
    setValue(
      "stepItems.Items",
      newItems as Array<{ item: string; price: number }>
    );

    // Create empty allocations for the duplicated items
    const newAllocations = [
      ...normalizedAllocations.slice(0, index + 1),
      ...Array(duplicateCount).fill([]),
      ...normalizedAllocations.slice(index + 1),
    ];

    setValue("stepAllocateItems", newAllocations);

    setDuplicateDrawerOpen(false);
    setCurrentDuplicateItem(null);
    setDuplicateCount(1);
  };

  return {
    duplicateDrawerOpen,
    currentDuplicateItem,
    duplicateCount,
    setDuplicateCount,
    setDuplicateDrawerOpen,
    openDuplicateForIndex,
    confirmDuplicate,
  };
}


