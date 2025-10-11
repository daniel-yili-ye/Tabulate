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

  // Helper to get the next available ID
  const getNextId = () => {
    if (participantFields.length === 0) return 1;
    const maxId = Math.max(...participantFields.map((p) => p.id));
    return maxId + 1;
  };

  const addParticipant = () => {
    appendParticipant({ id: getNextId(), name: "" });
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

  const setPartySize = (size: number) => {
    const currentSize = participantFields.length;
    
    if (size > currentSize) {
      // Add participants
      const participantsToAdd = size - currentSize;
      let nextId = getNextId();
      for (let i = 0; i < participantsToAdd; i++) {
        appendParticipant({ id: nextId + i, name: "" });
      }
    } else if (size < currentSize) {
      // Remove participants from the end
      const participantsToRemove = currentSize - size;
      const currentParticipants = getValues("stepParticipants");
      const currentAllocations = getValues("stepAllocateItems");
      
      // Get IDs of participants to remove
      const idsToRemove = currentParticipants
        .slice(size)
        .map((p) => p.id);
      
      // Remove participants
      for (let i = 0; i < participantsToRemove; i++) {
        removeParticipant(size);
      }
      
      // Update allocations to remove references to deleted participants
      const updatedAllocations = currentAllocations.map((allocation) =>
        allocation.filter(
          (participantId: number) => !idsToRemove.includes(participantId)
        )
      );
      
      setValue("stepAllocateItems", updatedAllocations);
    }
  };

  const canRemoveParticipant = participantFields.length > 2;

  return {
    participantFields,
    addParticipant,
    deleteParticipant,
    setPartySize,
    canRemoveParticipant,
  };
}; 