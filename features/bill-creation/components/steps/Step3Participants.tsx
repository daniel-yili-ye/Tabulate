import { useState, useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormData } from "@/lib/validation/formSchema";
import { useParticipantManager } from "../../hooks/useParticipantManager";
import { Plus, Trash2 } from "lucide-react";

export default function StepParticipants() {
  const {
    control,
    formState: { errors },
  } = useFormContext<FormData>();
  const {
    participantFields,
    addParticipant,
    deleteParticipant,
    setPartySize,
    canRemoveParticipant,
  } = useParticipantManager();

  const [selectedPartySize, setSelectedPartySize] = useState<string>(
    participantFields.length.toString()
  );

  useEffect(() => {
    if (participantFields.length > 0) {
      setSelectedPartySize(participantFields.length.toString());
    }
  }, [participantFields.length]);

  const handlePartySizeChange = (value: string) => {
    setSelectedPartySize(value);
    setPartySize(Number.parseInt(value));
  };

  return (
    <div className="space-y-6">
      {/* Party Size Selector */}
      <div className="space-y-2">
        <Label htmlFor="party-size">Number of people *</Label>
        <Select value={selectedPartySize} onValueChange={handlePartySizeChange}>
          <SelectTrigger id="party-size">
            <SelectValue placeholder="Select party size" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 9 }, (_, i) => i + 2).map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} {num === 1 ? "person" : "people"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Participant Name Inputs */}
      {participantFields.length > 0 && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <Label className="text-sm font-medium">
              Enter participant names *
            </Label>
          </div>

          <FieldGroup className="gap-4">
            {participantFields.map((field, index) => {
              const fieldError = errors.stepParticipants?.[index]?.name;
              const isInvalid = !!fieldError;

              return (
                <Controller
                  key={field.id}
                  control={control}
                  name={`stepParticipants.${index}.name`}
                  render={({ field: controllerField }) => (
                    <Field orientation="horizontal" data-invalid={isInvalid}>
                      <FieldContent>
                        <InputGroup>
                          <InputGroupInput
                            {...controllerField}
                            id={`participant-${index}`}
                            placeholder={`Person ${index + 1} name`}
                            aria-invalid={isInvalid}
                          />
                          {canRemoveParticipant && (
                            <InputGroupAddon align="inline-end">
                              <InputGroupButton
                                type="button"
                                variant="ghost"
                                onClick={() => deleteParticipant(index)}
                                aria-label={`Remove person ${index + 1}`}
                                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </InputGroupButton>
                            </InputGroupAddon>
                          )}
                        </InputGroup>
                        {isInvalid && <FieldError errors={[fieldError]} />}
                      </FieldContent>
                    </Field>
                  )}
                />
              );
            })}
          </FieldGroup>

          {/* Add More Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addParticipant}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Person
          </Button>
        </div>
      )}
    </div>
  );
}
