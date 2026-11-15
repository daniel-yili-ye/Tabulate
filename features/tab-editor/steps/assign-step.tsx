"use client";

import { useFormContext, useWatch } from "react-hook-form";
import {
  CheckIcon,
  DollarSignIcon,
  EqualIcon,
  type LucideIcon,
  PercentIcon,
  PieChartIcon,
  UsersIcon,
} from "lucide-react";
import { AmountRow } from "@/components/amount-rows";
import { MoneyInput } from "@/components/money-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCents } from "@/features/tabs/format";
import type {
  SplitType,
  TabDraft,
  TabItem,
  TabParticipant,
} from "@/features/tabs/schema";
import { computeSplit, splitItem } from "@/features/tabs/split";
import { cn } from "@/lib/utils";
import { withSharers, withSplitType, withWeight } from "../draft";

const SPLIT_OPTIONS: { value: SplitType; label: string; icon: LucideIcon }[] = [
  { value: "equal", label: "Equally", icon: EqualIcon },
  { value: "shares", label: "By shares", icon: PieChartIcon },
  { value: "percentage", label: "By percent", icon: PercentIcon },
  { value: "custom", label: "By amount", icon: DollarSignIcon },
];

/** "10% left to assign" style hint for percentage and custom splits. */
function BalanceHint({ item }: { item: TabItem }) {
  if (item.shares.length === 0) return null;
  if (item.splitType !== "percentage" && item.splitType !== "custom") return null;

  const isPercent = item.splitType === "percentage";
  const target = isPercent ? 100 : item.priceCents;
  const assigned = item.shares.reduce((sum, share) => sum + share.weight, 0);
  const difference = target - assigned;
  const show = (value: number) => (isPercent ? `${value}%` : formatCents(value));

  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs",
        difference === 0
          ? "text-emerald-600 dark:text-emerald-500"
          : "text-amber-600 dark:text-amber-500",
      )}
    >
      {difference === 0 ? (
        <>
          <CheckIcon className="size-3.5" />
          Adds up to {show(target)}
        </>
      ) : difference > 0 ? (
        `${show(difference)} left to assign`
      ) : (
        `${show(-difference)} over`
      )}
    </p>
  );
}

interface AssignItemProps {
  index: number;
  item: TabItem;
  participants: TabParticipant[];
  onChange: (item: TabItem) => void;
  error?: string;
}

function AssignItem({ index, item, participants, onChange, error }: AssignItemProps) {
  const amounts = splitItem(item);
  const shareIndex = new Map(
    item.shares.map((share, position) => [share.participantId, position]),
  );
  const everyone = item.shares.length === participants.length;

  const toggle = (participantId: string, checked: boolean) =>
    onChange(
      withSharers(
        item,
        // Keep sharers in the same order as the people list.
        participants
          .map((participant) => participant.id)
          .filter((id) => (id === participantId ? checked : shareIndex.has(id))),
      ),
    );

  return (
    <section
      className={cn("space-y-3 rounded-xl border p-4", error && "border-destructive")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium">{item.name || `Item ${index + 1}`}</h3>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatCents(item.priceCents)}
          </p>
        </div>
        <Select
          value={item.splitType}
          onValueChange={(value) => onChange(withSplitType(item, value as SplitType))}
        >
          <SelectTrigger className="w-36" aria-label="How to split this item">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {SPLIT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <SelectItem key={value} value={value}>
                <Icon />
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="space-y-1">
        {participants.map((participant) => {
          const position = shareIndex.get(participant.id);
          const selected = position !== undefined;
          const weight = selected ? item.shares[position].weight : 0;
          const inputId = `share-${item.id}-${participant.id}`;
          const setWeight = (value: number) =>
            onChange(withWeight(item, participant.id, value));

          return (
            <li
              key={participant.id}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-2",
                selected && "bg-muted/60",
              )}
            >
              <Checkbox
                id={inputId}
                checked={selected}
                onCheckedChange={(checked) => toggle(participant.id, checked === true)}
              />
              <label htmlFor={inputId} className="min-w-0 flex-1 truncate py-2 text-sm">
                {participant.name || "Unnamed"}
              </label>

              {selected && item.splitType === "shares" && (
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99}
                  aria-label={`${participant.name} shares`}
                  className="h-8 w-16 text-center"
                  value={weight || ""}
                  onChange={(event) =>
                    setWeight(Math.min(99, Math.max(0, Math.trunc(event.target.valueAsNumber || 0))))
                  }
                />
              )}
              {selected && item.splitType === "percentage" && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    aria-label={`${participant.name} percent`}
                    className="h-8 w-16 text-center"
                    value={weight || ""}
                    placeholder="0"
                    onChange={(event) =>
                      setWeight(Math.min(100, Math.max(0, Math.trunc(event.target.valueAsNumber || 0))))
                    }
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              )}
              {selected && item.splitType === "custom" && (
                <MoneyInput
                  aria-label={`${participant.name} amount`}
                  className="h-8 w-24"
                  value={weight}
                  onChange={setWeight}
                />
              )}
              {selected && item.splitType !== "custom" && (
                <span className="w-16 text-right text-sm text-muted-foreground tabular-nums">
                  {formatCents(amounts[position])}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <BalanceHint item={item} />
          {error && <FieldError>{error}</FieldError>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() =>
            onChange(withSharers(item, everyone ? [] : participants.map((p) => p.id)))
          }
        >
          {everyone ? "Clear" : "Everyone"}
        </Button>
      </div>
    </section>
  );
}

export function AssignStep() {
  const {
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitted },
  } = useFormContext<TabDraft>();
  const draft = useWatch({ control }) as TabDraft;
  const { items, participants } = draft;
  const split = computeSplit(draft);

  // Once problems are showing, re-check on every change so they clear when fixed.
  const options = { shouldDirty: true, shouldValidate: isSubmitted || !!errors.items };

  const splitAllEvenly = () =>
    setValue(
      "items",
      getValues("items").map((item) =>
        withSharers({ ...item, splitType: "equal" }, participants.map((p) => p.id)),
      ),
      options,
    );

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" className="w-full" onClick={splitAllEvenly}>
        <UsersIcon data-icon="inline-start" />
        Split everything evenly
      </Button>

      {items.map((item, index) => {
        const error = errors.items?.[index]?.shares;
        return (
          <AssignItem
            key={item.id}
            index={index}
            item={item}
            participants={participants}
            onChange={(next) => setValue(`items.${index}`, next, options)}
            error={error?.root?.message ?? error?.message}
          />
        );
      })}

      <div className="space-y-2 rounded-lg bg-muted/60 p-4">
        <h3 className="text-sm font-semibold">What everyone owes</h3>
        {split.people.map((person) => (
          <AmountRow
            key={person.id}
            label={person.name || "Unnamed"}
            cents={person.totalCents}
          />
        ))}
        {split.unassignedCents > 0 && (
          <p className="flex justify-between gap-4 text-sm text-amber-600 dark:text-amber-500">
            <span>Not assigned yet</span>
            <span className="font-medium tabular-nums">
              {formatCents(split.unassignedCents)}
            </span>
          </p>
        )}
        <AmountRow label="Receipt total" cents={split.totalCents} tone="total" />
      </div>
    </div>
  );
}
