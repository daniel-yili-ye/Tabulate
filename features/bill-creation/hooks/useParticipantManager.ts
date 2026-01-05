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
    if (currentAllocations && Array.isArray(currentAllocations)) {
      const updatedAllocations = currentAllocations.map((allocation) => {
        if (!allocation) {
          return { splitType: "equal" as const, participantIds: [] };
        }
        
        // Remove the participant from participantIds
        const updatedParticipantIds = allocation.participantIds.filter(
          (participantId: number) => participantId !== idToRemove
        );
        
        // Also clean up from shares/percentages/customAmounts if present
        const updatedAllocation = {
          ...allocation,
          participantIds: updatedParticipantIds,
        };
        
        if (allocation.shares && allocation.shares[idToRemove]) {
          const { [idToRemove]: _, ...restShares } = allocation.shares;
          updatedAllocation.shares = restShares;
        }
        if (allocation.percentages && allocation.percentages[idToRemove]) {
          const { [idToRemove]: _, ...restPercentages } = allocation.percentages;
          updatedAllocation.percentages = restPercentages;
        }
        if (allocation.customAmounts && allocation.customAmounts[idToRemove]) {
          const { [idToRemove]: _, ...restCustom } = allocation.customAmounts;
          updatedAllocation.customAmounts = restCustom;
        }
        
        return updatedAllocation;
      });
      
      setValue("stepAllocateItems", updatedAllocations);
    }
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
      if (currentAllocations && Array.isArray(currentAllocations)) {
        const updatedAllocations = currentAllocations.map((allocation) => {
          if (!allocation) {
            return { splitType: "equal" as const, participantIds: [] };
          }
          
          // Remove the participants from participantIds
          const updatedParticipantIds = allocation.participantIds.filter(
            (participantId: number) => !idsToRemove.includes(participantId)
          );
          
          // Also clean up from shares/percentages/customAmounts if present
          const updatedAllocation = {
            ...allocation,
            participantIds: updatedParticipantIds,
          };
          
          if (allocation.shares) {
            const cleanedShares = { ...allocation.shares };
            idsToRemove.forEach((id) => delete cleanedShares[id]);
            updatedAllocation.shares = cleanedShares;
          }
          if (allocation.percentages) {
            const cleanedPercentages = { ...allocation.percentages };
            idsToRemove.forEach((id) => delete cleanedPercentages[id]);
            updatedAllocation.percentages = cleanedPercentages;
          }
          if (allocation.customAmounts) {
            const cleanedCustom = { ...allocation.customAmounts };
            idsToRemove.forEach((id) => delete cleanedCustom[id]);
            updatedAllocation.customAmounts = cleanedCustom;
          }
          
          return updatedAllocation;
        });
        
        setValue("stepAllocateItems", updatedAllocations);
      }
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