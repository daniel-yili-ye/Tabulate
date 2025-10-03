import { z } from "zod";

const allocatedItemSchema = z.object({
  item: z.string(),
  fullPrice: z.number().optional(),
  price: z.number(),
  participants: z.number().int().positive(),
});

export const personAllocationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  items: z.array(allocatedItemSchema),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  discount: z.number(),
  total: z.number(),
});

export const billAllocationSchema = z.object({
  people: z.array(personAllocationSchema),
  overallTotal: z.number().optional(),
  overallSubtotal: z.number().optional(),
  totalTax: z.number().optional(),
  totalTip: z.number().optional(),
  totalDiscount: z.number().optional(),
});

export type PersonAllocation = z.infer<typeof personAllocationSchema>;
export type BillAllocation = z.infer<typeof billAllocationSchema>;
