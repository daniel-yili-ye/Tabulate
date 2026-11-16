"use client";

import { useState } from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import {
  CopyIcon,
  InfoIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SplitIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Totals } from "@/components/amount-rows";
import { CurrencySelect } from "@/components/currency-select";
import { MoneyInput } from "@/components/money-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LIMITS } from "@/features/tabs/limits";
import type { TabDraft } from "@/features/tabs/schema";
import { duplicateItem, newItem, splitItemInto } from "../draft";
import {
  ItemCountDrawer,
  type ItemCountMode,
  type ItemCountRequest,
} from "../item-count-drawer";

const CHARGES = [
  { name: "discountCents", label: "Discount" },
  { name: "taxCents", label: "Tax" },
  { name: "tipCents", label: "Tip" },
] as const;

function ReceiptTotals() {
  const { control } = useFormContext<TabDraft>();
  const [items, taxCents, tipCents, discountCents, currency] = useWatch({
    control,
    name: ["items", "taxCents", "tipCents", "discountCents", "currency"],
  });
  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0);

  return (
    <Totals
      title="Receipt total"
      subtotalCents={subtotalCents}
      discountCents={discountCents}
      taxCents={taxCents}
      tipCents={tipCents}
      totalCents={subtotalCents + taxCents + tipCents - discountCents}
      currency={currency}
    />
  );
}

function CurrencyHint() {
  // Controlled so that a tap opens it too: tooltips only react to hover and
  // keyboard focus by themselves, which leaves touch screens out.
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="About the currency"
            className="rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setOpen(true)}
          >
            <InfoIcon className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-60">
          The currency the receipt is in. If you were charged in a different
          one, you can add that once the tab is saved.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ItemsStep() {
  const {
    control,
    register,
    getValues,
    formState: { errors },
  } = useFormContext<TabDraft>();
  // RHF adds its own `id` to field array rows by default; ours must survive.
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
    keyName: "key",
  });
  const currency = useWatch({ control, name: "currency" });
  // The request outlives `countOpen` so the drawer keeps its content while it
  // animates closed.
  const [countRequest, setCountRequest] = useState<ItemCountRequest | null>(null);
  const [countOpen, setCountOpen] = useState(false);

  const askCount = (mode: ItemCountMode, index: number) => {
    setCountRequest((previous) => ({
      id: (previous?.id ?? 0) + 1,
      mode,
      item: getValues(`items.${index}`),
      currency,
    }));
    setCountOpen(true);
  };

  const applyCount = (count: number) => {
    setCountOpen(false);
    if (!countRequest) return;
    const items = getValues("items");
    const index = items.findIndex((item) => item.id === countRequest.item.id);
    if (index === -1) return;
    const item = items[index];
    const isSplit = countRequest.mode === "split";
    // A split adds count - 1 rows, a duplicate adds count.
    const room = LIMITS.maxItems - items.length;
    const allowed = Math.min(count, isSplit ? room + 1 : room);
    if (allowed < (isSplit ? 2 : 1)) {
      toast.error(`A tab can have at most ${LIMITS.maxItems} items.`);
      return;
    }
    const replacement = isSplit
      ? splitItemInto(item, allowed)
      : [item, ...duplicateItem(item, allowed)];
    replace(items.toSpliced(index, 1, ...replacement));
  };

  const canAdd = fields.length < LIMITS.maxItems;

  return (
    <div className="space-y-6">
      <FieldGroup>
        <Field data-invalid={!!errors.businessName}>
          <FieldLabel htmlFor="businessName">Where was this?</FieldLabel>
          <Input
            id="businessName"
            placeholder="Restaurant or store name"
            maxLength={LIMITS.businessNameLength}
            aria-invalid={!!errors.businessName}
            {...register("businessName")}
          />
          <FieldError errors={[errors.businessName]} />
        </Field>
        <Field data-invalid={!!errors.date}>
          <FieldLabel htmlFor="date">Date</FieldLabel>
          <Input
            id="date"
            type="date"
            aria-invalid={!!errors.date}
            {...register("date")}
          />
          <FieldError errors={[errors.date]} />
        </Field>
        <Controller
          control={control}
          name="currency"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center gap-1.5">
                <FieldLabel htmlFor="currency">Currency</FieldLabel>
                <CurrencyHint />
              </div>
              <CurrencySelect
                id="currency"
                value={field.value}
                onValueChange={field.onChange}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">Items</h2>
        {fields.map((field, index) => (
          <div key={field.key} className="flex items-center gap-2">
            <Input
              aria-label={`Item ${index + 1} name`}
              placeholder={`Item ${index + 1}`}
              maxLength={LIMITS.itemNameLength}
              className="flex-1"
              {...register(`items.${index}.name`)}
            />
            <Controller
              control={control}
              name={`items.${index}.priceCents`}
              render={({ field: price }) => (
                <MoneyInput
                  aria-label={`Item ${index + 1} price`}
                  className="w-28"
                  currency={currency}
                  value={price.value}
                  onChange={price.onChange}
                  onBlur={price.onBlur}
                  ref={price.ref}
                />
              )}
            />
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`More actions for item ${index + 1}`}
                >
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto whitespace-nowrap">
                <DropdownMenuItem
                  onSelect={() => askCount("split", index)}
                >
                  <SplitIcon />
                  Split into parts
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canAdd}
                  onSelect={() => askCount("duplicate", index)}
                >
                  <CopyIcon />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={fields.length === 1}
                  onSelect={() => remove(index)}
                >
                  <Trash2Icon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          disabled={!canAdd}
          onClick={() => append(newItem())}
        >
          <PlusIcon data-icon="inline-start" />
          Add item
        </Button>
      </div>

      <div className="space-y-2">
        {CHARGES.map(({ name, label }) => (
          <Controller
            key={name}
            control={control}
            name={name}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between gap-4">
                  <FieldLabel htmlFor={name}>{label}</FieldLabel>
                  <MoneyInput
                    id={name}
                    className="w-28"
                    currency={currency}
                    aria-invalid={fieldState.invalid}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                </div>
                <FieldError errors={[fieldState.error]} className="text-right" />
              </Field>
            )}
          />
        ))}
      </div>

      <ReceiptTotals />

      <ItemCountDrawer
        open={countOpen}
        request={countRequest}
        onConfirm={applyCount}
        onClose={() => setCountOpen(false)}
      />
    </div>
  );
}
