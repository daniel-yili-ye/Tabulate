import { WalletIcon } from "lucide-react";

/** The tab's "how to pay" message, shown to everyone who opens it. */
export function PaymentNote({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4">
      <WalletIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Payment Note</p>
        <p className="text-sm break-words whitespace-pre-wrap text-muted-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}
