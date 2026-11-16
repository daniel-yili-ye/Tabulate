"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { setTabPaymentMessage } from "../actions";
import { LIMITS } from "../limits";

interface PaymentNoteDialogProps {
  slug: string;
  message: string;
  /** The button that opens the dialog. */
  children: React.ReactNode;
}

/** Where a tab's owner writes or changes how people should pay them back. */
export function PaymentNoteDialog({ slug, message, children }: PaymentNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(message);
  const [pending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    // Start from what is saved, not from an abandoned edit.
    if (next) setDraft(message);
    setOpen(next);
  };

  const save = () =>
    startTransition(async () => {
      const result = await setTabPaymentMessage(slug, draft);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment note</DialogTitle>
          <DialogDescription>
            Tell everyone how to pay you back. It is shown on this tab and in
            the message you share.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            // This dialog can sit inside another form-less dialog; keep the
            // submit to itself.
            event.stopPropagation();
            save();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="tabPaymentMessage" className="sr-only">
                Payment note
              </FieldLabel>
              <Textarea
                id="tabPaymentMessage"
                rows={4}
                maxLength={LIMITS.paymentMessageLength}
                placeholder="Please e-transfer me at you@example.com"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <FieldDescription className="flex justify-between gap-4">
                <span>
                  Leave it empty for no note. The note new tabs start with is in
                  your{" "}
                  <Link
                    href="/settings"
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    settings
                  </Link>
                  .
                </span>
                <span className="tabular-nums">
                  {draft.length}/{LIMITS.paymentMessageLength}
                </span>
              </FieldDescription>
            </Field>
            <Button type="submit" disabled={pending} className="self-start">
              {pending && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              Save
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
