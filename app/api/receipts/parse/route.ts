import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  apiErrorStatus,
  readReceipt,
  receiptScanningConfigured,
} from "@/features/receipts/read-receipt";
import { getMyProfile } from "@/features/tabs/queries";
import { RECEIPTS_BUCKET } from "@/lib/env";
import { createClient, getUser } from "@/lib/supabase/server";

// Vision calls on a long receipt can take a while.
export const maxDuration = 60;
const MODEL_TIMEOUT_MS = 50_000;

const requestSchema = z.object({
  path: z
    .string()
    .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/),
});

const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return fail("Sign in to scan receipts.", 401);

  const body = requestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success || !body.data.path.startsWith(`${user.id}/`)) {
    return fail("Invalid receipt image.", 400);
  }

  if (!receiptScanningConfigured()) {
    console.error("Neither GROQ_API_KEY nor GEMINI_API_KEY is set");
    return fail("Receipt scanning isn't configured.", 503);
  }

  const supabase = await createClient();

  const { data: allowed, error: limitError } =
    await supabase.rpc("claim_receipt_scan");
  if (limitError) {
    console.error("claim_receipt_scan failed", limitError);
    return fail("Receipt scanning is unavailable right now. Try again shortly.", 503);
  }
  if (!allowed) {
    return fail("You've scanned a lot of receipts. Try again in an hour.", 429);
  }

  const { data: image, error: downloadError } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .download(body.data.path);
  if (downloadError || !image) {
    return fail("Couldn't read the uploaded image. Try uploading it again.", 400);
  }

  const startedAt = Date.now();

  try {
    const { currency: fallbackCurrency } = await getMyProfile(user.id);
    const { receipt, model } = await readReceipt({
      fallbackCurrency,
      image: new Uint8Array(await image.arrayBuffer()),
      mediaType: image.type || "image/jpeg",
      // Stop when the user cancels as well as when the model takes too long.
      signal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(MODEL_TIMEOUT_MS),
      ]),
    });
    console.info(`Receipt parsed by ${model} in ${Date.now() - startedAt}ms`);

    if (!receipt) {
      return fail(
        "We couldn't find any items. Use a clear, well-lit photo of the receipt, or enter the items by hand.",
        422,
      );
    }
    return NextResponse.json(receipt);
  } catch (error) {
    if (request.signal.aborted) return fail("Scan cancelled.", 499);

    const elapsed = Date.now() - startedAt;
    console.error(`Receipt parsing failed after ${elapsed}ms`, error);

    if (error instanceof Error && error.name === "TimeoutError") {
      return fail(
        "Reading the receipt took too long. Try again, or enter the items by hand.",
        504,
      );
    }
    const status = apiErrorStatus(error);
    if (status !== null) {
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        // Bad key, key without access to the model, or an unknown model name.
        return fail("Receipt scanning isn't set up correctly.", 503);
      }
      if (status === 429) {
        return fail("Receipt scanning is busy right now. Try again in a minute.", 503);
      }
    }
    return fail(
      "We couldn't read that receipt. Try again, or enter the items by hand.",
      502,
    );
  }
}
