// components/StepParticipants.tsx
import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  const { control } = useFormContext<FormData>();
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

          <div className="space-y-3">
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
