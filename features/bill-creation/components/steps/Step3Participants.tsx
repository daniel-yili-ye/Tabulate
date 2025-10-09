// components/StepParticipants.tsx
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormData } from "@/lib/validation/formSchema";
import { PlusIcon } from "@radix-ui/react-icons";
import { useParticipantManager } from "../../hooks/useParticipantManager";
import { Plus, Trash2 } from "lucide-react";

export default function StepParticipants() {
  const { control } = useFormContext<FormData>();
  const {
    participantFields,
    addParticipant,
    deleteParticipant,
    canRemoveParticipant,
  } = useParticipantManager();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {participantFields.map((field, index) => (
          <div key={field.id} className="flex space-x-2">
            <FormField
              control={control}
              name={`stepParticipants.${index}.name`}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      placeholder={`Person ${index + 1} name`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => deleteParticipant(index)}
              className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              disabled={!canRemoveParticipant}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={addParticipant}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Participant
      </Button>
    </div>
  );
}
