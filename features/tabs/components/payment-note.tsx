import { PencilIcon, PlusIcon, WalletIcon } from "lucide-react";
import { SettingCard } from "@/components/setting-card";
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
      <SettingCard
        empty
        icon={<WalletIcon />}
        title="No payment note yet"
        description="Tell everyone how to pay you back."
      >
        <PaymentNoteDialog slug={slug} message={message}>
          <Button variant="outline" size="sm">
            <PlusIcon data-icon="inline-start" />
            Add a note
          </Button>
        </PaymentNoteDialog>
      </SettingCard>
    );
  }

  return (
    <SettingCard icon={<WalletIcon />} title="Payment note" description={message}>
      {isOwner && (
        <PaymentNoteDialog slug={slug} message={message}>
          <Button variant="ghost" size="icon" aria-label="Edit payment note">
            <PencilIcon />
          </Button>
        </PaymentNoteDialog>
      )}
    </SettingCard>
  );
}
