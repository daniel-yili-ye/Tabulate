import { v4 as uuidv4 } from "uuid";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FormData } from "@/features/bill-creation/schemas/formSchema";

export const useParticipantManager = () => {
  const { control, getValues, setValue } = useFormContext<FormData>();

  const {
    fields: participantFields,
    append: appendParticipant,
    remove: removeParticipant,
  } = useFieldArray({
    control: control,
    name: "stepParticipants",
    keyName: "key",
  });

  const addParticipant = () => {
    appendParticipant({ id: uuidv4(), name: "" });
  };

  const deleteParticipant = (index: number) => {
    // Get the participant ID that's being removed
    const participantToRemove = participantFields[index];
    if (!participantToRemove) return;

    const idToRemove = participantToRemove.id;

    // Remove the participant from stepParticipants
    removeParticipant(index);

    // Update stepAllocateItems to remove the participant from all allocations
    const currentAllocations = getValues("stepAllocateItems");
    const updatedAllocations = currentAllocations.map((allocation) =>
      allocation.filter((participantId: string) => participantId !== idToRemove)
    );
    
    setValue("stepAllocateItems", updatedAllocations);
  };

  const canRemoveParticipant = participantFields.length > 2;

  return {
    participantFields,
    addParticipant,
    deleteParticipant,
    canRemoveParticipant,
  };
}; 