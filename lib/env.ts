function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See README.md.`);
  }
  return value;
}

// NEXT_PUBLIC_ variables must be referenced literally so Next.js can inline them.
export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabasePublishableKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
};

export const RECEIPTS_BUCKET = "receipts";

export function receiptImageUrl(path: string): string {
  return `${env.supabaseUrl}/storage/v1/object/public/${RECEIPTS_BUCKET}/${path}`;
}
