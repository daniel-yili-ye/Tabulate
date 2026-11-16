import { currencyDigits, currencyFormatter } from "./currency.ts";

/** 1234 in USD -> "$12.34", 1234 in JPY -> "¥1,234". */
export function formatCents(cents: number, currency: string): string {
  return currencyFormatter(currency).format(cents / 10 ** currencyDigits(currency));
}

/**
 * An amount from an untrusted source (the receipt parser) to whole minor units
 * of the given currency.
 */
export function dollarsToCents(
  dollars: number | null | undefined,
  currency: string,
): number {
  if (dollars == null || !Number.isFinite(dollars)) return 0;
  return Math.round(dollars * 10 ** currencyDigits(currency));
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Receipt dates are calendar days with no time zone, stored as YYYY-MM-DD.
 * Parsing them with `new Date(string)` would treat them as UTC midnight and
 * show the previous day west of Greenwich, so they are built from parts.
 */
export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const isRealDay =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return isRealDay ? date : null;
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDate(
  value: string,
  month: "short" | "long" = "short",
): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
  });
}
