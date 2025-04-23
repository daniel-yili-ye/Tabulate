import { z } from "zod";

// Schema for an individual item within a person's allocation
const allocatedItemSchema = z.object({
  item: z.string(),
  fullPrice: z.number().optional(), // Price before splitting
  price: z.number(), // Price portion for this person
  participants: z.number().int().positive(), // How many people shared this item
});

// Schema for a single person's calculated allocation
export const personAllocationSchema = z.object({
  id: z.string().uuid(), // Assuming participant ID from form
  name: z.string(),
  items: z.array(allocatedItemSchema),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  discount: z.number(),
  total: z.number(),
});

// Schema for the overall bill allocation result
export const billAllocationSchema = z.object({
  people: z.array(personAllocationSchema),
  overallTotal: z.number().optional(), // Optional based on billSplitter output
  overallSubtotal: z.number().optional(),
  totalTax: z.number().optional(),
  totalTip: z.number().optional(),
  totalDiscount: z.number().optional(),
});

// Infer TypeScript types from the schemas
export type PersonAllocation = z.infer<typeof personAllocationSchema>;
export type BillAllocation = z.infer<typeof billAllocationSchema>;
