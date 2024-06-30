// components/Step1MealName.tsx
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { FormData } from "../lib/formSchema";

interface Step1MealNameProps {
  form: UseFormReturn<FormData>;
}

export default function Step1MealName({ form }: Step1MealNameProps) {
  return (
    <FormField
      control={form.control}
      name="mealName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Meal Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter meal name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
