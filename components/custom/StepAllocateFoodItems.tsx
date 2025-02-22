// components/StepAllocateFoodItems.tsx
import React, { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { FormData } from "../../schema/formSchema";
import { Checkbox } from "../ui/checkbox";
import { Loader2 } from "lucide-react";

export default function StepAllocateFoodItems() {
  const { control, watch, setValue } = useFormContext<FormData>();

  const foodItems = watch("stepFoodItems.foodItems");
  const participants = watch("stepParticipants");

  if (!foodItems || !participants) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-4">
      {foodItems.map((foodItem, foodItemIndex) => (
        <FormField
          key={foodItemIndex}
          control={control}
          name={`stepAllocateFoodItems.${foodItemIndex}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{foodItem.item}</FormLabel>
              {participants.map((participant) => (
                <FormItem
                  key={participant.id}
                  className="flex flex-row items-center space-x-4 space-y-0"
                >
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(participant.id)}
                      onCheckedChange={(checked) => {
                        const updatedIds = checked
                          ? [...(field.value || []), participant.id]
                          : (field.value || []).filter(
                              (id) => id !== participant.id
                            );
                        field.onChange(updatedIds);
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {participant.name}
                  </FormLabel>
                </FormItem>
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
