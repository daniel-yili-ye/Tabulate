"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  ArrowLeftRightIcon,
  CircleCheckIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  UserCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { CurrencySelect } from "@/components/currency-select";
import { MoneyInput } from "@/components/money-input";
import { SettingCard } from "@/components/setting-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  setParticipantPaid,
  setTabAllowGuestPaid,
  setTabConversion,
} from "../actions";
import { convertTab, impliedRate } from "../convert";
import type { CurrencyCode } from "../currency";
import { formatCents } from "../format";
import type { SharedTab } from "../schema";
import { computeSplit } from "../split";
import { PaymentNote } from "./payment-note";
import { TabSummary } from "./tab-summary";

interface ConversionDialogProps {
  tab: SharedTab;
  totalCents: number;
  /** The currency to suggest when the tab has no conversion yet. */
  suggestedCurrency: CurrencyCode | null;
  onSaved: () => void;
}

/** Where the owner says what the tab really cost them in another currency. */
function ConversionDialog({
  tab,
  totalCents,
  suggestedCurrency,
  onSaved,
}: ConversionDialogProps) {
  const existing = tab.settleCurrency !== null;
  const initialCurrency =
    tab.settleCurrency ??
    (suggestedCurrency !== tab.currency ? (suggestedCurrency ?? "") : "");

  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode | "">(initialCurrency);
  const [charged, setCharged] = useState(tab.settleTotalCents ?? 0);
  const [pending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Start from what is saved, not from an abandoned edit.
      setCurrency(initialCurrency);
      setCharged(tab.settleTotalCents ?? 0);
    }
    setOpen(next);
  };

  const submit = (conversion: { currency: string; totalCents: number } | null) =>
    startTransition(async () => {
      const result = await setTabConversion(tab.slug, conversion);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (conversion) onSaved();
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {existing ? (
          <Button variant="ghost" size="icon" aria-label="Edit currency conversion">
            <PencilIcon />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <PlusIcon data-icon="inline-start" />
            Add
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert this tab</DialogTitle>
          <DialogDescription>
            Enter what your bank charged you for the whole{" "}
            {formatCents(totalCents, tab.currency)} {tab.currency} bill.
            Everyone will see what they owe in that currency, at the rate you
            actually paid.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (currency && charged > 0) submit({ currency, totalCents: charged });
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settleCurrency">Currency you were charged in</FieldLabel>
              <CurrencySelect
                id="settleCurrency"
                value={currency}
                onValueChange={setCurrency}
                exclude={tab.currency}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="settleTotal">Total charged</FieldLabel>
              <MoneyInput
                id="settleTotal"
                // The amount box is sized for its currency, so it needs one.
                currency={currency || tab.currency}
                disabled={!currency}
                value={charged}
                onChange={setCharged}
              />
              <FieldDescription>
                The exact amount on your card or bank statement, fees included.
              </FieldDescription>
            </Field>
            <div className="flex flex-wrap justify-between gap-2">
              <Button type="submit" disabled={pending || !currency || charged <= 0}>
                {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
                Save
              </Button>
              {existing && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => submit(null)}
                >
                  Remove conversion
                </Button>
              )}
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const rateFormat = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 5 });

interface TabAmountsProps {
  tab: SharedTab;
  /** The owner's own currency, when the owner is the one looking. */
  ownerCurrency: CurrencyCode | null;
}

/**
 * Everything on a tab that is an amount. When the owner has said what they were
 * charged in another currency, anyone can flip the whole tab between the two.
 */
export function TabAmounts({ tab, ownerCurrency }: TabAmountsProps) {
  // Only matters while there is a conversion, and then the charged currency is
  // the one people pay back in.
  const [view, setView] = useState<"receipt" | "charged">("charged");

  // Shown at once, then settled by the server's answer.
  const [paidIds, setPaidOptimistically] = useOptimistic(
    tab.participants.filter((person) => person.paid).map((person) => person.id),
    (current: string[], change: { id: string; paid: boolean }) =>
      change.paid
        ? [...current.filter((id) => id !== change.id), change.id]
        : current.filter((id) => id !== change.id),
  );
  const [, startPaidChange] = useTransition();

  const changePaid = (id: string, paid: boolean) =>
    startPaidChange(async () => {
      setPaidOptimistically({ id, paid });
      const result = await setParticipantPaid(tab.slug, id, paid);
      if (result?.error) toast.error(result.error);
    });

  const [allowGuestPaid, setAllowOptimistically] = useOptimistic(tab.allowGuestPaid);

  const changeAllowGuestPaid = (allow: boolean) =>
    startPaidChange(async () => {
      setAllowOptimistically(allow);
      const result = await setTabAllowGuestPaid(tab.slug, allow);
      if (result?.error) toast.error(result.error);
    });

  const people = tab.participants.length;
  const paidCount = tab.participants.filter((person) => paidIds.includes(person.id)).length;

  const receiptSplit = computeSplit(tab);
  const conversion =
    tab.settleCurrency && tab.settleTotalCents && receiptSplit.totalCents > 0
      ? { currency: tab.settleCurrency, totalCents: tab.settleTotalCents }
      : null;
  const showCharged = conversion !== null && view === "charged";

  const shownTab = showCharged ? convertTab(tab, conversion.totalCents) : tab;
  const shownSplit = showCharged ? computeSplit(shownTab) : receiptSplit;
  const shownCurrency = showCharged ? conversion.currency : tab.currency;

  const dialog = tab.isOwner && receiptSplit.totalCents > 0 && (
    <ConversionDialog
      tab={tab}
      totalCents={receiptSplit.totalCents}
      suggestedCurrency={ownerCurrency}
      onSaved={() => setView("charged")}
    />
  );

  return (
    <div className="space-y-3">
      <PaymentNote slug={tab.slug} message={tab.paymentMessage} isOwner={tab.isOwner} />

      {conversion ? (
        <SettingCard
          icon={<ArrowLeftRightIcon />}
          title={`${formatCents(receiptSplit.totalCents, tab.currency)} ${tab.currency} charged as ${formatCents(conversion.totalCents, conversion.currency)} ${conversion.currency}`}
          description={
            <span className="tabular-nums">
              1 {tab.currency} ={" "}
              {rateFormat.format(
                impliedRate(
                  { currency: tab.currency, totalCents: receiptSplit.totalCents },
                  conversion,
                ),
              )}{" "}
              {conversion.currency}
            </span>
          }
        >
          <div
            role="group"
            aria-label="Show amounts in"
            className="flex gap-0.5 rounded-lg border bg-background p-0.5"
          >
            {(
              [
                ["receipt", tab.currency],
                ["charged", conversion.currency],
              ] as const
            ).map(([option, code]) => (
              <Button
                key={option}
                size="sm"
                variant={view === option ? "secondary" : "ghost"}
                aria-pressed={view === option}
                onClick={() => setView(option)}
              >
                {code}
              </Button>
            ))}
          </div>
          {dialog}
        </SettingCard>
      ) : (
        dialog && (
          <SettingCard
            empty
            icon={<ArrowLeftRightIcon />}
            title="Charged in another currency?"
            description="Show what everyone owes in the currency you paid in."
          >
            {dialog}
          </SettingCard>
        )
      )}

      {tab.isOwner && (
        <SettingCard
          icon={<UserCheckIcon />}
          title="Let others mark as paid"
          description="Anyone with the link can mark a share as paid."
        >
          <Switch
            aria-label="Let others mark as paid"
            checked={allowGuestPaid}
            onCheckedChange={changeAllowGuestPaid}
          />
        </SettingCard>
      )}

      {/* Set apart from the options above by the same gap as the page's sections. */}
      <div className="space-y-3 not-first:pt-3">
        {paidCount === people ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-500">
            <CircleCheckIcon className="size-4" />
            Everyone has paid
          </p>
        ) : (
          <p className="text-sm text-muted-foreground tabular-nums">
            {paidCount} of {people} people are marked as paid
          </p>
        )}

        <TabSummary
          tab={shownTab}
          split={shownSplit}
          currency={shownCurrency}
          paidIds={paidIds}
          onPaidChange={tab.isOwner || tab.allowGuestPaid ? changePaid : undefined}
        />
      </div>
    </div>
  );
}
