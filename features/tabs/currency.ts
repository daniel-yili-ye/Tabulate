/**
 * Currencies a tab can be in, as ISO 4217 codes. Amounts are stored as whole
 * minor units of the tab's currency ("cents" throughout the code): hundredths
 * for most currencies, whole units for the ones without decimals, like JPY.
 */
export const CURRENCY_CODES = [
  "USD", "CAD", "EUR", "GBP", "AUD", "NZD", "JPY", "CNY", "HKD", "TWD", "KRW",
  "SGD", "INR", "THB", "VND", "IDR", "MYR", "PHP", "CHF", "SEK", "NOK", "DKK",
  "ISK", "PLN", "CZK", "HUF", "TRY", "AED", "ILS", "ZAR", "MXN", "BRL", "ARS",
  "CLP", "COP", "PEN",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

const CODES: ReadonlySet<string> = new Set(CURRENCY_CODES);

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && CODES.has(value);
}

/** A currency code from an untrusted source (the receipt parser), or null. */
export function toCurrency(value: string | null | undefined): CurrencyCode | null {
  const code = value?.trim().toUpperCase();
  return isCurrency(code) ? code : null;
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Amounts use the narrow symbol ("$", not "CA$"); the code is shown where it matters. */
export function currencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: isCurrency(currency) ? currency : DEFAULT_CURRENCY,
      currencyDisplay: "narrowSymbol",
    });
    formatters.set(currency, formatter);
  }
  return formatter;
}

/** How many decimals the currency has: 2 for USD, 0 for JPY. */
export function currencyDigits(currency: string): number {
  return currencyFormatter(currency).resolvedOptions().maximumFractionDigits ?? 2;
}

/** "$", "€", "CHF". */
export function currencySymbol(currency: string): string {
  const part = currencyFormatter(currency)
    .formatToParts(0)
    .find(({ type }) => type === "currency");
  return part?.value ?? currency;
}

const names = new Intl.DisplayNames("en", { type: "currency" });

/** "Canadian Dollar". */
export function currencyName(currency: string): string {
  return names.of(currency) ?? currency;
}
