import { useFieldArray, useFormContext } from "react-hook-form";
import { FormData } from "@/lib/validation/formSchema";

export const useItemsManager = () => {
  const { control, getValues, setValue } = useFormContext<FormData>();

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
    update: updateItem,
    insert: insertItem,
  } = useFieldArray({
    control: control,
    name: "stepItems.Items",
  });

  const {
    fields: allocationFields,
    append: appendAllocation,
    remove: removeAllocation,
    insert: insertAllocation,
  } = useFieldArray({
    control: control,
    name: "stepAllocateItems",
  });

  const addItem = () => {
    appendItem({ item: "", price: 0 });
    appendAllocation([]);
  };

  const deleteItem = (index: number) => {
    removeItem(index);
    removeAllocation(index);
  };

  const splitItem = (index: number, splitCount: number) => {
    if (splitCount < 2) return;

    const currentItems = getValues("stepItems.Items");
    const itemToSplit = currentItems[index];
    
    if (!itemToSplit) return;

    const { item, price } = itemToSplit;
    const numericPrice = Number(price) || 0;

    const splitAmounts = calculateSplitAmounts(numericPrice, splitCount);

    const currentAllocations = getValues("stepAllocateItems");
    const normalizedAllocations = currentItems.map(
      (_, i) => currentAllocations[i] || []
    );

    updateItem(index, { item, price: splitAmounts[0] });

    for (let i = 1; i < splitCount; i++) {
      insertItem(index + i, { item, price: splitAmounts[i] });
    }

    const newAllocations = [
      ...normalizedAllocations.slice(0, index),
      ...Array(splitCount).fill([]),
      ...normalizedAllocations.slice(index + 1),
    ];

    setValue("stepAllocateItems", newAllocations);
  };

  return {
    itemFields,
    addItem,
    deleteItem,
    splitItem,
  };
};

const calculateSplitAmounts = (totalPrice: number, splitCount: number): number[] => {
  const totalCents = Math.round(totalPrice * 100);
  const baseCents = Math.floor(totalCents / splitCount);
  const remainderCents = totalCents % splitCount;

  const splitAmounts = Array(splitCount).fill(baseCents);

  for (let i = 0; i < remainderCents; i++) {
    splitAmounts[i] += 1;
  }

  return splitAmounts.map((cents) => cents / 100);
}; 