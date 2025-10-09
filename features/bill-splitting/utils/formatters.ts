/**
 * Utility functions for formatting currency and dates
 */

export const roundCents = (amount: number | undefined): string => {
  if (amount === undefined || isNaN(amount)) return "0.00";
  return (amount ? Math.round(amount * 100) / 100 : 0).toFixed(2);
};

export const formatDate = (date: Date | string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const dateObject = typeof date === "string" ? new Date(date) : date;
  return dateObject.toLocaleString("en-US", options);
};

