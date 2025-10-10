import { useState, useMemo } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { FormData } from "@/lib/validation/formSchema";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/components/lib/utils";
import ItemRow from "../ItemRow";
import SplitDialog from "../SplitDialog";
import { useSplitItem } from "../../hooks/useSplitItem";

export default function StepItems() {
  const { control, watch } = useFormContext<FormData>();

  const {
    fields: fieldsItems,
    append: appendItems,
    remove: removeItems,
  } = useFieldArray({ control, name: "stepItems.Items" });

  const { append: appendAllocation, remove: removeAllocation } = useFieldArray({
    control,
    name: "stepAllocateItems",
  });

  const handleAdd = () => {
    appendItems({ item: "", price: 0 });
    appendAllocation([]);
  };

  const handleRemove = (index: number) => {
    removeItems(index);
    removeAllocation(index);
  };

  const {
    splitDialogOpen,
    currentSplitItem,
    splitCount,
    setSplitCount,
    setSplitDialogOpen,
    openSplitForIndex,
    confirmSplit,
  } = useSplitItem();

  // Watch ALL form values for real-time calculation
  const watchedValues = watch();

  // Calculate totals from watched values
  const calculations = useMemo(() => {
    const items = watchedValues?.stepItems?.Items || [];
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item?.price) || 0),
      0
    );

    const discountAmount = Number(watchedValues?.stepItems?.discount) || 0;
    const taxAmount = Number(watchedValues?.stepItems?.tax) || 0;
    const tipAmount = Number(watchedValues?.stepItems?.tip) || 0;

    const total = subtotal - discountAmount + taxAmount + tipAmount;

    return {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      tip: tipAmount,
      total,
    };
  }, [watchedValues]);

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
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
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="font-medium">Items</h1>
          {fieldsItems.map((field, index) => (
            <ItemRow
              key={field.id}
              index={index}
              canDelete={fieldsItems.length > 1}
              onSplit={() => openSplitForIndex(index)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
        <Button
          className="w-full border-dashed"
          type="button"
          variant="outline"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <SplitDialog
        open={splitDialogOpen}
        splitCount={splitCount}
        currentSplitItem={currentSplitItem}
        onSplitCountChange={setSplitCount}
        onClose={() => setSplitDialogOpen(false)}
        onConfirm={confirmSplit}
      />

      <div className="space-y-4">
        <FormField
          control={control}
          name="stepItems.discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <Input
                    className="pl-8"
                    placeholder="0.00"
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    {...field}
                    value={field.value === 0 ? "" : field.value}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="stepItems.tax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <Input
                    className="pl-8"
                    placeholder="0.00"
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    {...field}
                    value={field.value === 0 ? "" : field.value}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="stepItems.tip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tip</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    $
                  </span>
                  <Input
                    className="pl-8"
                    placeholder="0.00"
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    {...field}
                    value={field.value === 0 ? "" : field.value}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Summary */}
      <div className="space-y-3 bg-muted/50 rounded-lg p-4 border">
        <h3 className="font-semibold text-foreground">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal:</span>
            <span className="text-foreground font-medium">
              ${formatCurrency(calculations.subtotal)}
            </span>
          </div>

          {calculations.discount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-500">
              <span>Discount:</span>
              <span className="font-medium">
                -${formatCurrency(calculations.discount)}
              </span>
            </div>
          )}

          {calculations.tax > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax:</span>
              <span className="text-foreground font-medium">
                ${formatCurrency(calculations.tax)}
              </span>
            </div>
          )}

          {calculations.tip > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tip:</span>
              <span className="text-foreground font-medium">
                ${formatCurrency(calculations.tip)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>${formatCurrency(calculations.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
