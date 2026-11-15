"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { LIMITS } from "@/features/tabs/limits";
import type { TabDraft } from "@/features/tabs/schema";
import { newParticipant, withoutParticipant } from "../draft";

export function PeopleStep() {
  // react-hook-form mutates errors.participants in place, so a memoised row
  // list would keep showing errors that have been fixed.
  "use no memo";

  const {
    control,
    register,
    getValues,
    setValue,
    setFocus,
    formState: { errors },
  } = useFormContext<TabDraft>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
    keyName: "key",
  });

  const canAdd = fields.length < LIMITS.maxParticipants;
  const canRemove = fields.length > LIMITS.minParticipants;

  const addPerson = () => {
    if (canAdd) append(newParticipant());
  };

  const removePerson = (index: number) => {
    const { id } = getValues(`participants.${index}`);
    remove(index);
    setValue("items", withoutParticipant(getValues("items"), id), {
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const error = errors.participants?.[index]?.name;
        const isLast = index === fields.length - 1;

        return (
          <div key={field.key} className="space-y-1">
            <InputGroup>
              <InputGroupInput
                aria-label={`Person ${index + 1} name`}
                placeholder={`Person ${index + 1}`}
                autoComplete="off"
                maxLength={LIMITS.nameLength}
                enterKeyHint={isLast ? "done" : "next"}
                aria-invalid={!!error}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  if (isLast) addPerson();
                  else setFocus(`participants.${index + 1}.name`);
                }}
                {...register(`participants.${index}.name`)}
              />
              {canRemove && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={`Remove person ${index + 1}`}
                    onClick={() => removePerson(index)}
                  >
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <FieldError errors={[error]} />
          </div>
        );
      })}

      <FieldError errors={[errors.participants?.root ?? errors.participants]} />

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        disabled={!canAdd}
        onClick={addPerson}
      >
        <PlusIcon data-icon="inline-start" />
        Add person
      </Button>
    </div>
  );
}
