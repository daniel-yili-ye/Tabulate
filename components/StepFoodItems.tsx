// components/Step3stepFoodItems.foodItems.tsx
import { UseFormReturn, useFieldArray, useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { FormData } from "../lib/formSchema";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

export default function StepFoodItems() {
  const { control } = useFormContext<FormData>();

  const {
    fields: fieldsFoodItems,
    append: appendFoodItems,
    remove: removeFoodItems,
  } = useFieldArray({
    control: control,
    name: "stepFoodItems.foodItems",
  });

  const {
    fields: fieldsAllocation,
    append: appendAllocation,
    remove: removeAllocation,
  } = useFieldArray({
    control: control,
    name: "stepAllocateFoodItems",
  });

  // handleAdd
  const handleAdd = () => {
    appendFoodItems({ item: "", price: 0 });
    appendAllocation([]);
  };

  const handleRemove = (index: number) => {
    removeFoodItems(index);
    removeAllocation(index);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <FormField
          control={control}
          name="stepFoodItems.restaurantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restaurant Name</FormLabel>
              <FormControl>
                <Input placeholder="Restaurant name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="stepFoodItems.date"
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
          {fieldsFoodItems.map((field, index) => (
            <div key={field.id} className="flex space-x-2">
              <FormField
                control={control}
                name={`stepFoodItems.foodItems.${index}.item`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input placeholder="Food item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`stepFoodItems.foodItems.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Price"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
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
                disabled={fieldsFoodItems.length <= 1}
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
          &nbsp;Add Food Item
        </Button>
      </div>
      <div className="space-y-4">
        <FormField
          control={control}
          name="stepFoodItems.tax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Tax amount"
                  type="number"
                  inputMode="numeric"
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
          name="stepFoodItems.tip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tip (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Tip amount"
                  type="number"
                  inputMode="numeric"
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
          name="stepFoodItems.discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Discount amount"
                  type="number"
                  inputMode="numeric"
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
