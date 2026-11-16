import { Input } from "@/components/ui/input";
import { currencyDigits, currencySymbol } from "@/features/tabs/currency";
import { LIMITS } from "@/features/tabs/limits";
import { cn } from "@/lib/utils";

interface MoneyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  /** Amount in minor units of `currency`. */
  value: number;
  onChange: (cents: number) => void;
  currency: string;
}

/**
 * Cash-register style amount field: digits fill in from the right, so typing
 * "1250" gives $12.50 (or ¥1250) and there is never a decimal point to get
 * wrong.
 */
export function MoneyInput({
  value,
  onChange,
  currency,
  className,
  style,
  ...props
}: MoneyInputProps) {
  const digits = currencyDigits(currency);
  const symbol = currencySymbol(currency);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
        {symbol}
      </span>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={(0).toFixed(digits)}
        value={value ? (value / 10 ** digits).toFixed(digits) : ""}
        onChange={(event) => {
          const entered = event.target.value.replace(/\D/g, "");
          onChange(Math.min(Number(entered), LIMITS.maxCents));
        }}
        className={cn("text-right tabular-nums", className)}
        // Room for the symbol, which is up to three letters wide ("CHF").
        style={{ paddingLeft: `calc(${symbol.length}ch + 1rem)`, ...style }}
        {...props}
      />
    </div>
  );
}
