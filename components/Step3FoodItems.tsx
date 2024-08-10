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

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "stepThree.foodItems",
  });

  return (
    <div>
      <div className="mb-4">
        <div className="space-y-2">
          <FormLabel>Items</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex space-x-2 mb-2">
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
                onClick={() => remove(index)}
                variant="destructive"
                disabled={fields.length <= 1}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => append({ item: "", price: 0 })}
          className="mt-4 mb-4"
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
