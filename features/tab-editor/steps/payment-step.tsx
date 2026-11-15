"use client";

import Link from "next/link";
import { useFormContext, useWatch } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/features/tabs/limits";
import type { TabDraft } from "@/features/tabs/schema";

export function PaymentStep() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<TabDraft>();
  const message = useWatch({ control, name: "paymentMessage" });
  const error = errors.paymentMessage?.message;

  return (
    <Field>
      <FieldLabel htmlFor="paymentMessage">Payment note</FieldLabel>
      <Textarea
        id="paymentMessage"
        rows={4}
        maxLength={LIMITS.paymentMessageLength}
        placeholder="Please e-transfer me at you@example.com"
        aria-invalid={!!error}
        {...register("paymentMessage")}
      />
      <FieldDescription className="flex justify-between gap-4">
        <span>
          Shown on this tab and in the message you share. Leave it empty for no
          note. It starts as the default from your{" "}
          <Link
            href="/settings"
            target="_blank"
            className="font-medium text-foreground underline underline-offset-4"
          >
            settings
          </Link>
          .
        </span>
        <span className="tabular-nums">
          {message.length}/{LIMITS.paymentMessageLength}
        </span>
      </FieldDescription>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
