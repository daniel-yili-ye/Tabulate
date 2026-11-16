import { PencilIcon, PlusIcon, WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentNoteDialog } from "./payment-note-dialog";

interface PaymentNoteProps {
  slug: string;
  message: string;
  isOwner: boolean;
}

/**
 * The tab's "how to pay" message, shown to everyone who opens it. The owner
 * can change it here, and is asked for one when it is missing.
 */
export function PaymentNote({ slug, message, isOwner }: PaymentNoteProps) {
  if (!message) {
    if (!isOwner) return null;

    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4">
        <WalletIcon className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">No payment note yet</p>
          <p className="text-sm text-muted-foreground">
            Tell everyone how to pay you back.
          </p>
        </div>
        <PaymentNoteDialog slug={slug} message={message}>
          <Button variant="outline" size="sm">
            <PlusIcon data-icon="inline-start" />
            Add a note
          </Button>
        </PaymentNoteDialog>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4">
      <WalletIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Payment Note</p>
        <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
          {message}
        </p>
      </div>
      {isOwner && (
        <PaymentNoteDialog slug={slug} message={message}>
          <Button variant="ghost" size="icon" aria-label="Edit payment note">
            <PencilIcon />
          </Button>
        </PaymentNoteDialog>
      )}
    </div>
  );
}
