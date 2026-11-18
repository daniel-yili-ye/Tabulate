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

// Pinned on purpose. The "gemini-flash-latest" alias accepted requests with
// this project's key but never answered them, and this model reads a full
// receipt in about ten seconds.
const DEFAULT_MODEL = "gemini-2.5-flash";

// The vision model on Groq's free plan. Only used when Gemini is unavailable.
const DEFAULT_FALLBACK_MODEL = "qwen/qwen3.8-27b";

export const receiptModel = () => process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

export const receiptApiKey = () =>
  process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const fallbackModel = () => process.env.GROQ_MODEL ?? DEFAULT_FALLBACK_MODEL;

/**
 * The HTTP status behind a failed model call, or null if the call failed for
 * another reason. The SDK wraps the error once it has used up its retries.
 */
export function apiErrorStatus(error: unknown): number | null {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  return APICallError.isInstance(cause) ? (cause.statusCode ?? 0) : null;
}

/** Rate limits and outages are worth a second provider; a bad request is not. */
function isUnavailable(error: unknown): boolean {
  const status = apiErrorStatus(error);
  return status !== null && (status === 0 || status === 429 || status >= 500);
}

interface ReadReceiptInput {
  apiKey: string;
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
 * Ask the vision model to read a receipt photo. When Gemini is rate limited or
 * down and a Groq key is set, the photo is read by Groq instead. Throws on
 * timeouts, cancellation and API errors.
 */
export async function readReceipt({
  apiKey,
  image,
  mediaType,
  fallbackCurrency,
  signal,
}: ReadReceiptInput): Promise<ReadReceiptResult> {
  const extract = async (
    model: LanguageModel,
    providerOptions?: { groq: GroqLanguageModelChatOptions },
  ) => {
    const { output } = await generateText({
      model,
      // Reasoning is left at the model default: turning it off is faster but
      // lets free modifiers and other noise through as items.
      maxRetries: 1,
      output: Output.object({ schema: extractionSchema }),
      providerOptions,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            { type: "file", mediaType, data: image },
          ],
        },
      ],
      abortSignal: signal,
    });
    return normalizeExtraction(output, fallbackCurrency);
  };

  const model = receiptModel();
  try {
    const google = createGoogleGenerativeAI({ apiKey });
    return { receipt: await extract(google(model)), model };
  } catch (error) {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || signal.aborted || !isUnavailable(error)) throw error;

    const fallback = fallbackModel();
    console.warn(`${model} is unavailable, reading the receipt with ${fallback}`, error);
    try {
      const groq = createGroq({ apiKey: groqKey });
      const receipt = await extract(groq(fallback), {
        // Keeps the model's thinking out of the JSON answer.
        groq: { reasoningFormat: "parsed" },
      });
      return { receipt, model: fallback };
    } catch (fallbackError) {
      if (signal.aborted) throw fallbackError;
      console.error(`Fallback ${fallback} failed too`, fallbackError);
      // Report the primary's failure: it is the one worth fixing.
      throw error;
    }
  }
}
