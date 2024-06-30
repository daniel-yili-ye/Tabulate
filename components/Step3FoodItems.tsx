// components/Step3FoodItems.tsx
import { UseFormReturn, useFieldArray } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { FormData } from "../lib/formSchema";

interface Step3FoodItemsProps {
  form: UseFormReturn<FormData>;
}

export default function Step3FoodItems({ form }: Step3FoodItemsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "foodItems",
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex space-x-2 mb-2">
          <FormField
            control={form.control}
            name={`foodItems.${index}.item`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Food item" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`foodItems.${index}.price`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Price" type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            onClick={() => remove(index)}
            variant="destructive"
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        onClick={() => append({ item: "", price: "" })}
        className="mt-2 mb-4"
      >
        Add Food Item
      </Button>

      <FormField
        control={form.control}
        name="tax"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tax</FormLabel>
            <FormControl>
              <Input placeholder="Tax amount" type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tip"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tip</FormLabel>
            <FormControl>
              <Input placeholder="Tip amount" type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="discount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Discount</FormLabel>
            <FormControl>
              <Input placeholder="Discount amount" type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
