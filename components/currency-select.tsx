"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENCY_CODES,
  currencyName,
  type CurrencyCode,
} from "@/features/tabs/currency";
import { cn } from "@/lib/utils";

interface CurrencySelectProps {
  /** Empty when nothing is picked yet. */
  value: CurrencyCode | "";
  onValueChange: (currency: CurrencyCode) => void;
  /** A currency to leave out, e.g. the one being converted from. */
  exclude?: string;
  id?: string;
  /** Set to submit the value with a plain form. */
  name?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
}

export function CurrencySelect({
  value,
  onValueChange,
  exclude,
  id,
  name,
  className,
  ...aria
}: CurrencySelectProps) {
  return (
    <Select
      name={name}
      value={value}
      onValueChange={(next) => onValueChange(next as CurrencyCode)}
    >
      <SelectTrigger id={id} className={cn("w-full", className)} {...aria}>
        <SelectValue placeholder="Pick a currency" />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        {CURRENCY_CODES.filter((code) => code !== exclude).map((code) => (
          <SelectItem key={code} value={code}>
            <span className="font-medium tabular-nums">{code}</span>
            <span className="text-muted-foreground">{currencyName(code)}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
