// components/Step3stepThree.foodItems.tsx
import { UseFormReturn, useFieldArray, useFormContext } from "react-hook-form";
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

export default function Step3FoodItems() {
  const { control } = useFormContext<FormData>();

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "stepThree.foodItems",
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex space-x-2 mb-2">
          <FormField
            control={control}
            name={`stepThree.foodItems.${index}.item`}
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
            control={control}
            name={`stepThree.foodItems.${index}.price`}
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
        control={control}
        name="stepThree.tax"
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
        control={control}
        name="stepThree.tip"
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
        control={control}
        name="stepThree.discount"
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
