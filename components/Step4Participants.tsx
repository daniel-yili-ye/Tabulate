// components/Step4Participants.tsx
import { v4 as uuidv4 } from "uuid";
import { useFieldArray, useFormContext } from "react-hook-form";
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

  const {
    fields: fieldsNames,
    append: appendNames,
    remove: removeNames,
  } = useFieldArray({
    control: control,
    name: "stepFour",
    keyName: "key",
  });

  const handleAdd = () => {
    appendNames({ id: uuidv4(), name: "" });
  };

  const handleRemove = (index: number) => {
    // uuid of participant to remove
    const idToRemove = fieldsNames[index].id; // Ensure to use .id

    // Remove the participant from stepFour
    removeNames(index);

    // Update stepFive to remove the participant from all allocations
    const currentStepFive = getValues("stepFive");
    const updatedStepFive = currentStepFive.map((arr) =>
      arr.filter((id: string) => id !== idToRemove)
    );
    setValue("stepFive", updatedStepFive);
  };

  return (
    <div>
      {fieldsNames.map((field, index) => (
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
            disabled={fieldsNames.length <= 2}
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
        onClick={() => handleAdd()}
      >
        <PlusIcon />
        &nbsp;Add Participant
      </Button>
    </div>
  );
}
