import "server-only";

import { APICallError, generateText, Output, RetryError } from "ai";
import type { LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq, type GroqLanguageModelChatOptions } from "@ai-sdk/groq";
import type { CurrencyCode } from "@/features/tabs/currency";
import {
  EXTRACTION_PROMPT,
  extractionSchema,
  normalizeExtraction,
  type ParsedReceipt,
} from "./extraction";

// Tried first: the more accurate reader. Pinned on purpose. The
// "gemini-flash-latest" alias accepted requests with this project's key but
// never answered them, and this model reads a full receipt in about ten
// seconds.
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

// The vision model on Groq's free plan. Less accurate but answers in a few
// seconds, so it can still finish after Gemini has used most of the time.
const DEFAULT_GROQ_MODEL = "qwen/qwen3.8-27b";

// How long a model may take before the next one is tried. The last model in
// line gets whatever is left of the request's own time limit.
const HANDOVER_MS = 30_000;

interface Reader {
  name: string;
  model: LanguageModel;
  providerOptions?: { groq: GroqLanguageModelChatOptions };
}

/** The configured models, in the order they are tried. */
function readers(): Reader[] {
  const list: Reader[] = [];

  const geminiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    const name = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
    list.push({ name, model: createGoogleGenerativeAI({ apiKey: geminiKey })(name) });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const name = process.env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL;
    list.push({
      name,
      model: createGroq({ apiKey: groqKey })(name),
      // Keeps the model's thinking out of the JSON answer.
      providerOptions: { groq: { reasoningFormat: "parsed" } },
    });
  }

  return list;
}

/** Whether at least one model has an API key. */
export const receiptScanningConfigured = () => readers().length > 0;

/**
 * The HTTP status behind a failed model call, or null if the call failed for
 * another reason. The SDK wraps the error once it has used up its retries.
 */
export function apiErrorStatus(error: unknown): number | null {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  return APICallError.isInstance(cause) ? (cause.statusCode ?? 0) : null;
}

interface ReadReceiptInput {
  image: Uint8Array;
  mediaType: string;
  /** The user's own currency, for receipts that do not say which they are in. */
  fallbackCurrency: CurrencyCode;
  signal: AbortSignal;
}

interface ReadReceiptResult {
  /** Null when the photo has no usable items. */
  receipt: ParsedReceipt | null;
  /** The model that produced the reading. */
  model: string;
}

/**
 * Ask a vision model to read a receipt photo. Gemini is tried first; if it
 * fails or is slow, Groq reads the photo instead. Throws the first model's
 * error when every model fails, and stops at once when `signal` aborts.
 */
export async function readReceipt({
  image,
  mediaType,
  fallbackCurrency,
  signal,
}: ReadReceiptInput): Promise<ReadReceiptResult> {
  const list = readers();
  if (list.length === 0) throw new Error("No receipt model is configured");

  let firstError: unknown;
  for (const [index, reader] of list.entries()) {
    const isLast = index === list.length - 1;
    try {
      const { output } = await generateText({
        model: reader.model,
        // Reasoning is left at the model default: turning it off is faster but
        // lets free modifiers and other noise through as items.
        maxRetries: 1,
        output: Output.object({ schema: extractionSchema }),
        providerOptions: reader.providerOptions,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              { type: "file", mediaType, data: image },
            ],
          },
        ],
        abortSignal: isLast
          ? signal
          : AbortSignal.any([signal, AbortSignal.timeout(HANDOVER_MS)]),
      });
      return { receipt: normalizeExtraction(output, fallbackCurrency), model: reader.name };
    } catch (error) {
      // Cancelled or out of time altogether: there is nothing left to try.
      if (signal.aborted || isLast) throw firstError ?? error;
      firstError ??= error;
      console.warn(
        `${reader.name} could not read the receipt, trying ${list[index + 1].name}`,
        error,
      );
    }
  }
  throw firstError;
}
