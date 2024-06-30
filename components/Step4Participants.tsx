// components/Step4Participants.tsx
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

interface Step4ParticipantsProps {
  form: UseFormReturn<FormData>;
}

export default function Step4Participants({ form }: Step4ParticipantsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "participants",
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex space-x-2 mb-2">
          <FormField
            control={form.control}
            name={`participants.${index}`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Participant name" {...field} />
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
      <Button type="button" onClick={() => append("")} className="mt-2">
        Add Participant
      </Button>
    </div>
  );
}
