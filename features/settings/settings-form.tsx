"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { CurrencySelect } from "@/components/currency-select";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/features/tabs/limits";
import type { Profile } from "@/features/tabs/schema";
import { buildShareMessage } from "@/features/tabs/share";
import { updateProfile, type ProfileFormState } from "./actions";

const INITIAL: ProfileFormState = { status: "idle" };

export function SettingsForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, INITIAL);
  const [paymentMessage, setPaymentMessage] = useState(profile.paymentMessage);
  const [currency, setCurrency] = useState(profile.currency);

  // Saving refreshes the page, so `profile` is always what is stored. The note
  // is stored trimmed.
  const changed =
    paymentMessage.trim() !== profile.paymentMessage ||
    currency !== profile.currency;

  useEffect(() => {
    if (state.status === "saved") toast.success("Settings saved");
  }, [state]);

  const preview = buildShareMessage({
    businessName: "Osteria Lupo",
    date: "2026-05-16",
    paymentMessage,
    url: "tabulate.app/tab/…",
  });

  return (
    // Submitted by hand rather than through `action`: React resets a form after
    // its action runs, and the currency select answers a reset by going back
    // to the value the page loaded with, undoing the choice just saved.
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="paymentMessage">Default payment note</FieldLabel>
          <Textarea
            id="paymentMessage"
            name="paymentMessage"
            value={paymentMessage}
            onChange={(event) => setPaymentMessage(event.target.value)}
            maxLength={LIMITS.paymentMessageLength}
            rows={3}
            placeholder="Please e-transfer me at you@example.com"
          />
          <FieldDescription className="flex justify-between gap-4">
            <span>
              The starting note for each new tab, shown on the page and in the
              message you copy. You can change it per tab, and tabs you have
              already made keep their own note.
            </span>
            <span className="tabular-nums">
              {paymentMessage.length}/{LIMITS.paymentMessageLength}
            </span>
          </FieldDescription>
        </Field>

        <Field>
          <p className="text-sm font-medium">What people receive</p>
          <p className="rounded-lg border bg-muted/50 p-3 text-sm break-words whitespace-pre-wrap">
            {preview}
          </p>
        </Field>

        <Field>
          <FieldLabel htmlFor="currency">Your currency</FieldLabel>
          <input type="hidden" name="currency" value={currency} />
          <CurrencySelect
            id="currency"
            value={currency}
            onValueChange={setCurrency}
            className="sm:w-72"
          />
          <FieldDescription>
            New tabs start in this currency, and it is used when a scan
            can&apos;t tell which currency a receipt is in. You can change it
            on any tab.
          </FieldDescription>
        </Field>

        {state.status === "error" && <FieldError>{state.message}</FieldError>}

        <Button type="submit" disabled={pending || !changed} className="self-start">
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </FieldGroup>
    </form>
  );
}
