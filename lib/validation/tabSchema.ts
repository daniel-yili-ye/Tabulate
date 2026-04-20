import { z } from "zod";

/**
 * Split type options for each item
 */
export const splitTypeSchema = z.enum(["equal", "shares", "percentage", "custom"]);

/**
 * Receipt item schema
 */
export const receiptItemSchema = z.object({
  item: z.string(),
  price: z.number().nonnegative(),
});

/**
 * Receipt data schema
 */
export const receiptSchema = z.object({
  businessName: z.string(),
  date: z.string(), // ISO date string
  items: z.array(receiptItemSchema),
  tax: z.number().nonnegative().optional(),
  tip: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  subtotal: z.number().nonnegative(),
  total: z.number(),
});

/**
 * Participant schema
 */
export const participantSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Participant name is required"),
});

/**
 * Item allocation schema - supports all split types
 */
export const itemAllocationSchema = z.object({
  itemIndex: z.number().int().nonnegative(),
  splitType: splitTypeSchema,
  participantIds: z.array(z.number().int().positive()).min(1, "At least 1 participant required"),
  
  // Optional fields based on split type
  shares: z.record(z.coerce.string(), z.number().positive()).optional(),
  percentages: z.record(z.coerce.string(), z.number().min(0).max(100)).optional(),
  customAmounts: z.record(z.coerce.string(), z.number().nonnegative()).optional(),
}).refine((data) => {
  // Validate that percentages sum to 100 when using percentage split
  if (data.splitType === "percentage" && data.percentages) {
    const sum = Object.values(data.percentages).reduce((a, b) => a + b, 0);
    return Math.abs(sum - 100) < 0.01; // Allow small floating point errors
  }
  return true;
}, {
  message: "Percentages must sum to 100",
  path: ["percentages"],
});

/**
 * Person allocation (computed result) schema
 */
export const personAllocationSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  items: z.array(z.object({
    item: z.string(),
    fullPrice: z.number().optional(),
    price: z.number(),
    participants: z.number().int().positive(),
  })),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  discount: z.number(),
  total: z.number(),
});

/**
 * Computed allocation schema
 */
export const computedAllocationSchema = z.object({
  people: z.array(personAllocationSchema),
  overallTotal: z.number().optional(),
  overallSubtotal: z.number().optional(),
  totalTax: z.number().optional(),
  totalTip: z.number().optional(),
  totalDiscount: z.number().optional(),
});

/**
 * Full tab data schema (what goes in the `data` column)
 */
export const tabDataSchema = z.object({
  receipt: receiptSchema,
  participants: z.array(participantSchema).min(2, "At least 2 participants required"),
  allocations: z.array(itemAllocationSchema),
  computed: computedAllocationSchema,
});

/**
 * Request body for creating a tab
 */
export const createTabRequestSchema = z.object({
  receipt: receiptSchema,
  participants: z.array(participantSchema).min(2, "At least 2 participants required"),
  allocations: z.array(itemAllocationSchema),
  receiptImageUrl: z.string().url().nullish(),
});

// Type exports
export type SplitType = z.infer<typeof splitTypeSchema>;
export type ReceiptItem = z.infer<typeof receiptItemSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type ItemAllocation = z.infer<typeof itemAllocationSchema>;
export type PersonAllocation = z.infer<typeof personAllocationSchema>;
export type ComputedAllocation = z.infer<typeof computedAllocationSchema>;
export type TabData = z.infer<typeof tabDataSchema>;
export type CreateTabRequest = z.infer<typeof createTabRequestSchema>;
export type ReceiptImageUrl = z.infer<typeof createTabRequestSchema>["receiptImageUrl"];

