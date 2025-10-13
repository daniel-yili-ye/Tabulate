import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { FormData } from "@/lib/validation/formSchema";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function StepAllocateItems() {
  const { control, watch } = useFormContext<FormData>();

  const Items = watch("stepItems.Items");
  const participants = watch("stepParticipants");

  if (!Items || !participants) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-4">
      {Items.map((Item, ItemIndex) => (
        <div key={ItemIndex}>
          <FormField
            control={control}
            name={`stepAllocateItems.${ItemIndex}`}
            render={({ field }) => (
              <FormItem>
                <div className="space-x-2">
                  <FormLabel className="text-base">{Item.item}</FormLabel>
                  <FormLabel className="text-sm text-muted-foreground">
                    {Number(Item.price).toFixed(2)}
                  </FormLabel>
                </div>
                {participants.map((participant) => (
                  <FormItem
                    key={participant.id}
                    className="flex flex-row items-center space-x-4 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(participant.id) ?? false}
                        onCheckedChange={(checked) => {
                          const updatedIds = checked
                            ? [...(field.value || []), participant.id]
                            : (field.value || []).filter(
                                (id) => id !== participant.id
                              );
                          field.onChange(updatedIds);
                        }}
                        className="h-5 w-5"
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
          {/* Separator */}
          {ItemIndex < Items.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  );
}
