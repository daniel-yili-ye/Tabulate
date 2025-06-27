import { useFieldArray, useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { FormData } from "../../schema/formSchema";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/components/lib/utils";

export default function StepItems() {
  const { control } = useFormContext<FormData>();

  const {
    fields: fieldsItems,
    append: appendItems,
    remove: removeItems,
  } = useFieldArray({
    control: control,
    name: "stepItems.Items",
  });

  const {
    fields: fieldsAllocation,
    append: appendAllocation,
    remove: removeAllocation,
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
                        "w-[240px] pl-3 text-left font-normal",
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
        <div className="space-y-2">
          <FormLabel>Items</FormLabel>
          {fieldsItems.map((field, index) => (
            <div key={field.id} className="flex space-x-2">
              <FormField
                control={control}
                name={`stepItems.Items.${index}.item`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input placeholder="Item" {...field} />
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
              <Button
                type="button"
                onClick={() => handleRemove(index)}
                variant="destructive"
                disabled={fieldsItems.length <= 1}
              >
                <TrashIcon />
              </Button>
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
      <div className="space-y-4">
        <FormField
          control={control}
          name="stepItems.tax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax (optional)</FormLabel>
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
                Leave tax blank if tax-inclusive pricing is used.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="stepItems.tip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tip (optional)</FormLabel>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="stepItems.discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount (optional)</FormLabel>
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
                Enter the discount as a positive number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
