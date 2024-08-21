// components/Step3stepThree.foodItems.tsx
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
import { FormData } from "../lib/formSchema";
import { PlusIcon } from "@radix-ui/react-icons";

export default function Step3FoodItems() {
  const { control } = useFormContext<FormData>();

  const {
    fields: fieldsFoodItems,
    append: appendFoodItems,
    remove: removeFoodItems,
  } = useFieldArray({
    control: control,
    name: "stepThree.foodItems",
  });

  const {
    fields: fieldsAllocation,
    append: appendAllocation,
    remove: removeAllocation,
  } = useFieldArray({
    control: control,
    name: "stepFive",
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
    <div>
      <div className="mb-4">
        <div className="space-y-2">
          <FormLabel>Items</FormLabel>
          {fieldsFoodItems.map((field, index) => (
            <div key={field.id} className="flex space-x-4">
              <FormField
                control={control}
                name={`stepThree.foodItems.${index}.item`}
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
                name={`stepThree.foodItems.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Price"
                        type="number"
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
                Remove
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
          name="stepThree.tax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Tax amount"
                  type="number"
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
          name="stepThree.tip"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tip (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Tip amount"
                  type="number"
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
          name="stepThree.discount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Discount amount"
                  type="number"
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
