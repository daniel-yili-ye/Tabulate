import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormData } from "@/features/bill-creation/schemas/formSchema";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { useParticipantManager } from "../../hooks/useParticipantManager";

export default function StepParticipants() {
  const { control } = useFormContext<FormData>();
  const {
    participantFields,
    addParticipant,
    deleteParticipant,
    canRemoveParticipant,
  } = useParticipantManager();

  return (
    <div>
      {participantFields.map((field, index) => (
        <div key={field.id} className="flex space-x-4 mb-2">
          <FormField
            control={control}
            name={`stepParticipants.${index}.name`}
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
            onClick={() => deleteParticipant(index)}
            variant="destructive"
            disabled={!canRemoveParticipant}
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={addParticipant}
      >
        <PlusIcon />
        &nbsp;Add Participant
      </Button>
    </div>
  );
}
