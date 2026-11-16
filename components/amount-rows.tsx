import { cn } from "@/lib/utils";
import { formatCents } from "@/features/tabs/format";

interface AmountRowProps {
  label: string;
  cents: number;
  currency: string;
  /** "discount" shows a negative green amount, "total" is emphasised. */
  tone?: "default" | "discount" | "total";
  /** Hide the row when the amount is zero (optional lines like tip). */
  hideZero?: boolean;
}

export function AmountRow({
  label,
  cents,
  currency,
  tone = "default",
  hideZero,
}: AmountRowProps) {
  if (hideZero && cents === 0) return null;

  return (
    <div
      className={cn(
        "flex justify-between gap-4 text-sm",
        tone === "default" && "text-muted-foreground",
        tone === "discount" && "text-emerald-600 dark:text-emerald-500",
        tone === "total" && "border-t pt-2 text-base font-semibold",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          tone === "default" && "font-medium text-foreground",
        )}
      >
        {tone === "discount" && "-"}
        {formatCents(cents, currency)}
      </span>
    </div>
  );
}

interface TotalsProps {
  title?: string;
  subtotalLabel?: string;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  currency: string;
  className?: string;
}

/** Subtotal → discount → tax → tip → total, used for receipts and people alike. */
export function Totals({
  title,
  subtotalLabel = "Subtotal",
  subtotalCents,
  discountCents,
  taxCents,
  tipCents,
  totalCents,
  currency,
  className,
}: TotalsProps) {
  return (
    <div className={cn("space-y-2 rounded-lg bg-muted/60 p-4", className)}>
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <AmountRow label={subtotalLabel} cents={subtotalCents} currency={currency} />
      <AmountRow
        label="Discount"
        cents={discountCents}
        currency={currency}
        tone="discount"
        hideZero
      />
      <AmountRow label="Tax" cents={taxCents} currency={currency} hideZero />
      <AmountRow label="Tip" cents={tipCents} currency={currency} hideZero />
      <AmountRow label="Total" cents={totalCents} currency={currency} tone="total" />
    </div>
  );
}
