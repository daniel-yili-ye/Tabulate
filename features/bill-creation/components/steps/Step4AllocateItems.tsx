import { Controller, useFormContext } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
  FieldGroup,
} from "@/components/ui/field";
import { FormData } from "@/lib/validation/formSchema";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function StepAllocateItems() {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<FormData>();

  const Items = watch("stepItems.Items");
  const participants = watch("stepParticipants");

  if (!Items || !participants) {
    return <Loader2 className="h-8 w-8 animate-spin" />;
  }

  return (
    <div className="space-y-4">
      {Items.map((Item, ItemIndex) => {
        const fieldError = errors.stepAllocateItems?.[ItemIndex];
        const isInvalid = !!fieldError;

        return (
          <div key={ItemIndex}>
            <Controller
              control={control}
              name={`stepAllocateItems.${ItemIndex}`}
              render={({ field }) => (
                <FieldSet data-invalid={isInvalid}>
                  <div>
                    <FieldLabel className="text-base">{Item.item}</FieldLabel>
                    <span className="text-sm text-muted-foreground">
                      ${Number(Item.price).toFixed(2)}
                    </span>
                  </div>
                  <FieldGroup className="gap-3">
                    {participants.map((participant) => (
                      <Field
                        key={participant.id}
                        orientation="horizontal"
                        className="items-center space-y-0"
                      >
                        <Checkbox
                          id={`item-${ItemIndex}-participant-${participant.id}`}
                          checked={
                            field.value?.includes(participant.id) ?? false
                          }
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
                        <FieldLabel
                          htmlFor={`item-${ItemIndex}-participant-${participant.id}`}
                          className="font-normal cursor-pointer"
                        >
                          {participant.name}
                        </FieldLabel>
                      </Field>
                    ))}
                  </FieldGroup>
                  {isInvalid && <FieldError errors={[fieldError]} />}
                </FieldSet>
              )}
            />
            {ItemIndex < Items.length - 1 && <Separator className="my-4" />}
          </div>
        );
      })}
    </div>
  );
}
