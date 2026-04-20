"use client";

import { useMemo, useEffect } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
  FieldGroup,
} from "@/components/ui/field";
import {
  FormData,
  SplitType,
  ItemAllocation,
} from "@/lib/validation/formSchema";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Equal, PieChart, DollarSign, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/components/lib/utils";

const SPLIT_TYPE_OPTIONS: {
  value: SplitType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "equal",
    label: "Equal",
    icon: <Equal className="h-4 w-4" />,
    description: "Split evenly",
  },
  {
    value: "shares",
    label: "Shares",
    icon: <Users className="h-4 w-4" />,
    description: "By portions",
  },
  {
    value: "percentage",
    label: "Percentage",
    icon: <PieChart className="h-4 w-4" />,
    description: "By percent",
  },
  {
    value: "custom",
    label: "Custom",
    icon: <DollarSign className="h-4 w-4" />,
    description: "Exact amounts",
  },
];

interface ItemAllocationRowProps {
  itemIndex: number;
  itemName: string;
  itemPrice: number;
  participants: { id: number; name: string }[];
}

function ItemAllocationRow({
  itemIndex,
  itemName,
  itemPrice,
  participants,
}: ItemAllocationRowProps) {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<FormData>();

  const allocation = useWatch({
    control,
    name: `stepAllocateItems.${itemIndex}`,
  });

  const splitType = allocation?.splitType || "equal";
  const participantIds = allocation?.participantIds || [];
  const shares = allocation?.shares || {};
  const percentages = allocation?.percentages || {};
  const customAmounts = allocation?.customAmounts || {};

  const fieldError = errors.stepAllocateItems?.[itemIndex];
  const isInvalid = !!fieldError?.participantIds;

  // Calculate split preview
  const getSplitPreview = (participantId: number): string => {
    if (!participantIds.includes(participantId)) return "-";

    switch (splitType) {
      case "equal":
        return `$${(itemPrice / participantIds.length).toFixed(2)}`;
      case "shares": {
        const totalShares = participantIds.reduce(
          (sum, id) => sum + (shares[id] || 1),
          0
        );
        const personShares = shares[participantId] || 1;
        return `$${((itemPrice * personShares) / totalShares).toFixed(2)}`;
      }
      case "percentage": {
        const pct = percentages[participantId] || 0;
        return `$${((itemPrice * pct) / 100).toFixed(2)}`;
      }
      case "custom":
        return `$${(customAmounts[participantId] || 0).toFixed(2)}`;
      default:
        return "-";
    }
  };

  // Calculate percentage sum for validation hint
  const percentageSum = participantIds.reduce(
    (sum, id) => sum + (percentages[id] || 0),
    0
  );

  // Calculate custom amount sum for validation hint
  const customAmountSum = participantIds.reduce(
    (sum, id) => sum + (customAmounts[id] || 0),
    0
  );
  const customDifference = itemPrice - customAmountSum;
  const isCustomBalanced = Math.abs(customDifference) < 0.01;

  const handleParticipantToggle = (participantId: number, checked: boolean) => {
    const newIds = checked
      ? [...participantIds, participantId]
      : participantIds.filter((id) => id !== participantId);

    setValue(`stepAllocateItems.${itemIndex}.participantIds`, newIds, {
      shouldValidate: true,
    });

    // Clean up removed participant from shares/percentages/customAmounts
    if (!checked) {
      if (shares[participantId]) {
        const newShares = { ...shares };
        delete newShares[participantId];
        setValue(`stepAllocateItems.${itemIndex}.shares`, newShares);
      }
      if (percentages[participantId]) {
        const newPercentages = { ...percentages };
        delete newPercentages[participantId];
        setValue(`stepAllocateItems.${itemIndex}.percentages`, newPercentages);
      }
      if (customAmounts[participantId]) {
        const newCustom = { ...customAmounts };
        delete newCustom[participantId];
        setValue(`stepAllocateItems.${itemIndex}.customAmounts`, newCustom);
      }
    }
  };

  const handleSplitTypeChange = (newType: SplitType) => {
    setValue(`stepAllocateItems.${itemIndex}.splitType`, newType, {
      shouldValidate: true,
    });

    // Initialize default values when switching types
    if (newType === "shares" && Object.keys(shares).length === 0) {
      const defaultShares: Record<string, number> = {};
      participantIds.forEach((id) => {
        defaultShares[id] = 1;
      });
      setValue(`stepAllocateItems.${itemIndex}.shares`, defaultShares);
    }
    if (newType === "percentage" && Object.keys(percentages).length === 0) {
      const defaultPct: Record<string, number> = {};
      const count = participantIds.length;
      if (count > 0) {
        const basePct = Math.floor(100 / count);
        const remainder = 100 - basePct * count;
        participantIds.forEach((id, idx) => {
          // Distribute remainder to first few participants
          defaultPct[id] = basePct + (idx < remainder ? 1 : 0);
        });
      }
      setValue(`stepAllocateItems.${itemIndex}.percentages`, defaultPct);
    }
    if (newType === "custom" && Object.keys(customAmounts).length === 0) {
      const defaultCustom: Record<string, number> = {};
      const evenAmount =
        participantIds.length > 0 ? itemPrice / participantIds.length : 0;
      participantIds.forEach((id) => {
        defaultCustom[id] = Math.round(evenAmount * 100) / 100;
      });
      setValue(`stepAllocateItems.${itemIndex}.customAmounts`, defaultCustom);
    }
  };

  const handleShareChange = (participantId: number, value: number) => {
    setValue(`stepAllocateItems.${itemIndex}.shares`, {
      ...shares,
      [participantId]: value,
    });
  };

  const handlePercentageChange = (participantId: number, value: number) => {
    setValue(`stepAllocateItems.${itemIndex}.percentages`, {
      ...percentages,
      [participantId]: value,
    });
  };

  const handleCustomAmountChange = (participantId: number, value: number) => {
    setValue(`stepAllocateItems.${itemIndex}.customAmounts`, {
      ...customAmounts,
      [participantId]: value,
    });
  };

  return (
    <Controller
      control={control}
      name={`stepAllocateItems.${itemIndex}`}
      render={() => (
        <FieldSet data-invalid={isInvalid} className="space-y-3">
          {/* Header: Item name, price, and split type selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <FieldLabel className="text-base font-medium">
                {itemName || `Item ${itemIndex + 1}`}
              </FieldLabel>
              <span className="text-sm text-muted-foreground">
                ${Number(itemPrice).toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Split Method
              </span>
              <Select
                value={splitType}
                onValueChange={(v) => handleSplitTypeChange(v as SplitType)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPLIT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Percentage sum hint */}
          {splitType === "percentage" && participantIds.length > 0 && (
            <p
              className={cn(
                "text-xs",
                percentageSum === 100 ? "text-green-600" : "text-amber-600"
              )}
            >
              Total: {percentageSum}%{" "}
              {percentageSum === 100 ? "✓" : "(must equal 100%)"}
            </p>
          )}

          {/* Custom amount sum hint */}
          {splitType === "custom" && participantIds.length > 0 && (
            <p
              className={cn(
                "text-xs",
                isCustomBalanced
                  ? "text-green-600"
                  : customDifference > 0
                  ? "text-amber-600"
                  : "text-red-600"
              )}
            >
              {isCustomBalanced
                ? `Total: $${customAmountSum.toFixed(2)} ✓`
                : customDifference > 0
                ? `$${customDifference.toFixed(2)} remaining`
                : `$${Math.abs(customDifference).toFixed(2)} over`}
            </p>
          )}

          {/* Participants grid */}
          <FieldGroup className="gap-2">
            {participants.map((participant) => {
              const isSelected = participantIds.includes(participant.id);

              return (
                <div
                  key={participant.id}
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded-md h-10",
                    isSelected ? "bg-accent/50" : "bg-transparent"
                  )}
                >
                  {/* Checkbox */}
                  <Checkbox
                    id={`item-${itemIndex}-participant-${participant.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleParticipantToggle(participant.id, !!checked)
                    }
                    className="h-4 w-4"
                  />

                  {/* Name */}
                  <label
                    htmlFor={`item-${itemIndex}-participant-${participant.id}`}
                    className="flex-1 text-sm font-medium cursor-pointer"
                  >
                    {participant.name}
                  </label>

                  {/* Split input (only shown when selected and not equal) */}
                  {isSelected && splitType !== "equal" && (
                    <div className="flex items-center gap-2">
                      {splitType === "shares" && (
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={shares[participant.id] || 1}
                          onChange={(e) =>
                            handleShareChange(
                              participant.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-16 h-8 text-sm text-center"
                          placeholder="1"
                        />
                      )}
                      {splitType === "percentage" && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={
                              percentages[participant.id] !== undefined &&
                              percentages[participant.id] !== null
                                ? percentages[participant.id]
                                : ""
                            }
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === "") {
                                handlePercentageChange(participant.id, 0);
                                return;
                              }
                              const numValue = parseInt(inputValue, 10);
                              if (!isNaN(numValue)) {
                                handlePercentageChange(
                                  participant.id,
                                  Math.max(0, Math.min(100, numValue))
                                );
                              }
                            }}
                            className="w-16 h-8 text-sm text-center"
                            placeholder="0"
                          />
                          <span className="text-xs text-muted-foreground">
                            %
                          </span>
                        </div>
                      )}
                      {splitType === "custom" && (
                        <div className="w-24">
                          <CurrencyInput
                            value={customAmounts[participant.id] || 0}
                            onChange={(value) =>
                              handleCustomAmountChange(participant.id, value)
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview amount */}
                  {isSelected && (
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {getSplitPreview(participant.id)}
                    </span>
                  )}
                </div>
              );
            })}
          </FieldGroup>

          {isInvalid && <FieldError errors={[fieldError?.participantIds]} />}
        </FieldSet>
      )}
    />
  );
}

// Calculate each person's split amount for an item
function calculatePersonSplit(
  itemPrice: number,
  allocation: ItemAllocation,
  participantId: number
): number {
  if (!allocation?.participantIds?.includes(participantId)) return 0;

  const { splitType, participantIds, shares, percentages, customAmounts } =
    allocation;

  switch (splitType) {
    case "equal":
      return itemPrice / participantIds.length;
    case "shares": {
      const totalShares = participantIds.reduce(
        (sum, id) => sum + ((shares && shares[id]) || 1),
        0
      );
      const personShares = (shares && shares[participantId]) || 1;
      return (itemPrice * personShares) / totalShares;
    }
    case "percentage": {
      const pct = (percentages && percentages[participantId]) || 0;
      return (itemPrice * pct) / 100;
    }
    case "custom":
      return (customAmounts && customAmounts[participantId]) || 0;
    default:
      return itemPrice / participantIds.length;
  }
}

interface AllocationSummaryProps {
  items: { item?: string; price?: number }[];
  participants: { id: number; name: string }[];
  allocations: ItemAllocation[];
}

function AllocationSummary({
  items,
  participants,
  allocations,
}: AllocationSummaryProps) {
  // Calculate per-person subtotals dynamically
  const personSubtotals = useMemo(() => {
    const subtotals: Record<number, number> = {};
    participants.forEach((p) => {
      subtotals[p.id] = 0;
    });

    items.forEach((item, index) => {
      const allocation = allocations[index];
      if (!allocation) return;
      const itemPrice = Number(item.price) || 0;

      participants.forEach((p) => {
        subtotals[p.id] += calculatePersonSplit(itemPrice, allocation, p.id);
      });
    });

    return subtotals;
  }, [items, participants, allocations]);

  // Calculate total subtotal across all people
  const totalSubtotal = useMemo(() => {
    return Object.values(personSubtotals).reduce((sum, v) => sum + v, 0);
  }, [personSubtotals]);

  const formatCurrency = (amount: number) => amount.toFixed(2);

  return (
    <div className="space-y-3 bg-muted/50 rounded-lg p-4 border">
      <h3 className="font-semibold text-foreground">Allocation Summary</h3>

      {/* Per-person breakdown */}
      <div className="space-y-2 text-sm">
        {participants.map((participant) => {
          const subtotal = personSubtotals[participant.id] || 0;
          return (
            <div key={participant.id} className="flex justify-between">
              <span className="text-muted-foreground">{participant.name}:</span>
              <span className="text-foreground font-medium">
                ${formatCurrency(subtotal)}
              </span>
            </div>
          );
        })}

        <Separator />

        {/* Items subtotal */}
        <div className="flex justify-between text-muted-foreground">
          <span>Items Subtotal:</span>
          <span className="text-foreground font-medium">
            ${formatCurrency(totalSubtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StepAllocateItems() {
  const { control, setValue } = useFormContext<FormData>();

  // Use useWatch for reactive updates when form values change
  const Items = useWatch({ control, name: "stepItems.Items" }) || [];
  const participants = useWatch({ control, name: "stepParticipants" }) || [];
  const allocations = useWatch({ control, name: "stepAllocateItems" }) || [];

  // Ensure allocations array matches items array length
  useEffect(() => {
    if (Items.length > 0 && allocations.length !== Items.length) {
      const defaultAllocation = {
        splitType: "equal" as const,
        participantIds: [],
      };
      const newAllocations = [...allocations];

      // Add missing allocations
      while (newAllocations.length < Items.length) {
        newAllocations.push(defaultAllocation);
      }

      // Remove extra allocations
      if (newAllocations.length > Items.length) {
        newAllocations.splice(Items.length);
      }

      setValue("stepAllocateItems", newAllocations, { shouldValidate: false });
    }
  }, [Items.length, allocations.length, setValue]);

  if (
    !Items ||
    !participants ||
    Items.length === 0 ||
    participants.length === 0
  ) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Items.map((item, itemIndex) => (
        <div key={itemIndex}>
          <ItemAllocationRow
            itemIndex={itemIndex}
            itemName={item.item || ""}
            itemPrice={item.price || 0}
            participants={participants}
          />
          {itemIndex < Items.length - 1 && <Separator className="my-6" />}
        </div>
      ))}

      {/* Allocation Summary */}
      <AllocationSummary
        items={Items}
        participants={participants}
        allocations={allocations}
      />
    </div>
  );
}
