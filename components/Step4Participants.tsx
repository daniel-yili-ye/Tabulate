// components/Step4Participants.tsx
import { v4 as uuidv4 } from "uuid";
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
import { PlusIcon } from "@radix-ui/react-icons";

export default function Step4Participants() {
  const { control, getValues, setValue } = useFormContext<FormData>();

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "stepFour",
  });

  const handleRemove = (index: number) => {
    const participantToRemove = fields[index];

    console.log(fields);

    console.log(participantToRemove);

    // Remove the participant from stepFour
    remove(index);

    // Update stepFive to remove the participant from all allocations
    const currentStepFive = getValues("stepFive");

    console.log(currentStepFive);

    const updatedStepFive = currentStepFive
      .map((allocation) => ({
        ...allocation,
        participantIds: allocation.participantIds.filter(
          (id) => id !== participantToRemove.id
        ),
      }))
      .filter((allocation) => allocation.participantIds.length > 0);

    console.log(updatedStepFive);

    setValue("stepFive", updatedStepFive);
  };

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex space-x-4 mb-2">
          <FormField
            control={control}
            name={`stepFour.${index}.name`}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input placeholder="Participant name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            onClick={() => handleRemove(index)}
            variant="destructive"
            disabled={fields.length <= 2}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append({ id: uuidv4(), name: "" })}
      >
        <PlusIcon />
        &nbsp;Add Participant
      </Button>
    </div>
  );
}
