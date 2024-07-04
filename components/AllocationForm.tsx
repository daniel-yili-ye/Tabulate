import { Form, useFieldArray, useForm, useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { FormData } from "../lib/formSchema";
import { AllocationData, allocationSchema } from "../lib/allocationSchema";
import { Button } from "./ui/button";
import { zodResolver } from "@hookform/resolvers/zod";

export default function AllocationForm() {
  const form = useForm<AllocationData>({
    shouldUnregister: false,
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(allocationSchema),
  });

  const { fields } = useFieldArray({
    name: "",
  });

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        {fields.map((field, index) => (
          <FormField
            key={field.id}
            control={form.control}
            name={`allocation.${field.id}`}
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>
                  {field.name} - ${field.price.toFixed(2)}
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {people.map((person) => (
                      <Checkbox
                        key={person}
                        checked={field.value?.includes(person)}
                        onCheckedChange={(checked) => {
                          const updatedValue = checked
                            ? [...(field.value || []), person]
                            : (field.value || []).filter((p) => p !== person);
                          setValue(`allocation.${field.id}`, updatedValue);
                        }}
                      >
                        {person}
                      </Checkbox>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormField
          control={form.control}
          name="tax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax</FormLabel>
              <FormControl>
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
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
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
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
              <FormLabel>Discount (optional)</FormLabel>
              <FormControl>
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Calculate Breakdown</Button>
      </form>
    </Form>
  );
}
