import { formatDate } from "./format.ts";

interface ShareMessageInput {
  businessName: string;
  date: string;
  paymentMessage: string;
  url: string;
}

/** The text that is copied or sent when a tab is shared. */
export function buildShareMessage({
  businessName,
  date,
  paymentMessage,
  url,
}: ShareMessageInput): string {
  const lines = [
    `Here's the split for ${businessName} (${formatDate(date)}):`,
    url,
  ];
  if (paymentMessage.trim()) lines.push("", paymentMessage.trim());
  return lines.join("\n");
}
