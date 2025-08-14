import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormData } from "@/features/bill-creation/schemas/formSchema";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { CalendarIcon, Split, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/components/lib/utils";
import { Label } from "@/components/ui/label";

export default function StepItems() {
  const { control, getValues, setValue } = useFormContext<FormData>();
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [currentSplitItem, setCurrentSplitItem] = useState<{
    index: number;
    item: string;
    price: number;
  } | null>(null);
  const [splitCount, setSplitCount] = useState<number>(2);

  const {
    fields: fieldsItems,
    append: appendItems,
    remove: removeItems,
    update: updateItems,
    insert: insertItems,
  } = useFieldArray({
    control: control,
    name: "stepItems.Items",
  });

  const {
    fields: fieldsAllocation,
    append: appendAllocation,
    remove: removeAllocation,
    insert: insertAllocation,
  } = useFieldArray({
    control: control,
    name: "stepAllocateItems",
  });

  // handleAdd
  const handleAdd = () => {
    appendItems({ item: "", price: 0 });
    appendAllocation([]);
  };

  const handleRemove = (index: number) => {
    removeItems(index);
    removeAllocation(index);
  };

  const handleSplitItem = (index: number) => {
    console.log(getValues("stepItems.Items"));
    console.log(getValues("stepAllocateItems"));
    const currentItems = getValues("stepItems.Items");
    const itemToSplit = currentItems[index];

    setCurrentSplitItem({
      index,
      item: itemToSplit.item || "",
      price: Number(itemToSplit.price) || 0,
    });
    setSplitDialogOpen(true);
  };

  const confirmSplit = () => {
    if (!currentSplitItem || splitCount < 2) return;

    const { index, item, price } = currentSplitItem;

    // 🔧 FIXED: Proper penny allocation
    const totalCents = Math.round(price * 100);
    const baseCents = Math.floor(totalCents / splitCount);
    const remainderCents = totalCents % splitCount;

    // Create array of split amounts
    const splitAmounts = Array(splitCount).fill(baseCents);

    // Distribute remainder cents to first N items
    for (let i = 0; i < remainderCents; i++) {
      splitAmounts[i] += 1;
    }

    // Convert back to dollars
    const splitPrices = splitAmounts.map((cents) => cents / 100);

    // Get current state
    const currentItems = getValues("stepItems.Items");
    const currentAllocations = getValues("stepAllocateItems");
    const normalizedAllocations = currentItems.map(
      (_, i) => currentAllocations[i] || []
    );

    // Update the existing item with the first split amount
    updateItems(index, { item, price: splitPrices[0] });

    // Insert new items with their respective split amounts
    for (let i = 1; i < splitCount; i++) {
      insertItems(index + i, { item, price: splitPrices[i] });
    }

    // Handle allocations
    const newAllocations = [
      ...normalizedAllocations.slice(0, index),
      ...Array(splitCount).fill([]),
      ...normalizedAllocations.slice(index + 1),
    ];

    setValue("stepAllocateItems", newAllocations);

    setSplitDialogOpen(false);
    setCurrentSplitItem(null);
    setSplitCount(2);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* business name */}
        <FormField
          control={control}
          name="stepItems.businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name</FormLabel>
              <FormControl>
                <Input placeholder="Business name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* date */}
        <FormField
          control={control}
          name="stepItems.date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Receipt Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div>
        {/* items */}
        <div className="space-y-2">
          <h3 className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Items
          </h3>
          {fieldsItems.map((field, index) => (
            <div key={field.id} className="flex space-x-2">
              <FormField
                control={control}
                name={`stepItems.Items.${index}.item`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`stepItems.Items.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Price"
                        type="number"
                        inputMode="decimal"
                        {...field}
                        value={field.value === 0 ? "" : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" type="button">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  avoidCollisions={true}
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleSplitItem(index);
                    }}
                  >
                    <Split className="h-4 w-4 mr-2" />
                    Split Item
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(index);
                    }}
                    className="text-destructive focus:text-destructive"
                    disabled={fieldsItems.length <= 1}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Item
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => handleAdd()}
        >
          <PlusIcon />
          &nbsp;Add Item
        </Button>
      </div>

      {/* Split Item Dialog */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Split Item</DialogTitle>
            <DialogDescription>
              {`Split "${currentSplitItem?.item}" into multiple instances. The price will be divided equally.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="split-count" className="text-sm font-medium">
                Split into:
              </Label>
              <Input
                id="split-count"
                type="number"
                inputMode="numeric"
                min="2"
                max="50"
                value={splitCount}
                onChange={(e) => setSplitCount(parseInt(e.target.value) || 2)}
                className="col-span-3"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Original price: {Number(currentSplitItem?.price || 0).toFixed(2)}
              <br />
              Price per item:{" "}
              {splitCount > 0
                ? (Number(currentSplitItem?.price || 0) / splitCount).toFixed(2)
                : "--"}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSplitDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmSplit}
              disabled={!(splitCount >= 2 && splitCount <= 50)}
            >
              Split Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* discounts */}
      <div className="space-y-4">
        <FormField
          control={control}
          name="stepItems.discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Discount{" "}
                <span className="text-sm text-gray-500 font-normal">
                  (Optional)
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Discount amount"
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  {...field}
                  value={field.value === 0 ? "" : field.value}
                />
              </FormControl>
              <FormDescription>
                Enter a positive amount not a percentage.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* tax */}
        <FormField
          control={control}
          name="stepItems.tax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tax{" "}
                <span className="text-sm text-gray-500 font-normal">
                  (Optional)
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Tax amount"
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  {...field}
                  value={field.value === 0 ? "" : field.value}
                />
              </FormControl>
              <FormDescription>
                Enter an amount not a percentage. Leave blank if bill is
                tax-inclusive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* tip */}
        <FormField
          control={control}
          name="stepItems.tip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tip{" "}
                <span className="text-sm text-gray-500 font-normal">
                  (Optional)
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Tip amount"
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  {...field}
                  value={field.value === 0 ? "" : field.value}
                />
              </FormControl>
              <FormDescription>
                Enter an amount not a percentage.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
