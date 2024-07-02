// components/Step4Participants.tsx
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

export default function Step4Participants() {
  const { control } = useFormContext<FormData>();

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "stepFour",
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex space-x-2 mb-2">
          <FormField
            control={control}
            name={`stepFour.${index}.name`}
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
      <Button
        type="button"
        onClick={() => append({ name: "" })}
        className="mt-2"
      >
        Add Participant
      </Button>
    </div>
  );
}
