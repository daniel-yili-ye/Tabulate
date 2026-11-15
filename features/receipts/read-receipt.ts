import "server-only";

import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
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

export const receiptModel = () => process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

export const receiptApiKey = () =>
  process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;

interface ReadReceiptInput {
  apiKey: string;
  image: Uint8Array;
  mediaType: string;
  signal: AbortSignal;
}

/**
 * Ask the vision model to read a receipt photo. Returns null when the photo
 * has no usable items, and throws on timeouts, cancellation and API errors.
 */
export async function readReceipt({
  apiKey,
  image,
  mediaType,
  signal,
}: ReadReceiptInput): Promise<ParsedReceipt | null> {
  const google = createGoogleGenerativeAI({ apiKey });
  const { output } = await generateText({
    model: google(receiptModel()),
    // Reasoning is left at the model default: turning it off is faster but
    // lets free modifiers and other noise through as items.
    maxRetries: 1,
    output: Output.object({ schema: extractionSchema }),
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

  return normalizeExtraction(output);
}
