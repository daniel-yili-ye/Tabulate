import { useFieldArray, useFormContext } from "react-hook-form";
import { FormData } from "@/lib/validation/formSchema";

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
    appendParticipant({ id: participantFields.length + 1, name: "" });
  };

  const deleteParticipant = (index: number) => {
    const participantToRemove = participantFields[index];
    if (!participantToRemove) return;

    const idToRemove = participantToRemove.id;

    removeParticipant(index);

    const currentAllocations = getValues("stepAllocateItems");
    const updatedAllocations = currentAllocations.map((allocation) =>
      allocation.filter((participantId: number) => participantId !== idToRemove)
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