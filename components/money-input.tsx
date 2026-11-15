import { Input } from "@/components/ui/input";
import { LIMITS } from "@/features/tabs/limits";
import { cn } from "@/lib/utils";

interface MoneyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  /** Amount in cents. */
  value: number;
  onChange: (cents: number) => void;
}

/**
 * Cash-register style amount field: digits fill in from the right, so typing
 * "1250" gives $12.50 and there is never a decimal point to get wrong.
 */
export function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
        $
      </span>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0.00"
        value={value ? (value / 100).toFixed(2) : ""}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(Math.min(Number(digits), LIMITS.maxCents));
        }}
        className={cn("pl-6 text-right tabular-nums", className)}
        {...props}
      />
    </div>
  );
}
