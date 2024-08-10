// components/Step1MealName.tsx
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "./ui/form";
import { Input } from "./ui/input";
import { FormData } from "../lib/formSchema";

export default function Step1MealName() {
  const { control } = useFormContext<FormData>();

  return (
    <FormField
      control={control}
      name="stepOne.mealName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Meal Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter meal name" {...field} />
          </FormControl>
          <FormDescription>
            Please enter the name of your meal (ex. Maha&apos;s Brunch).
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
