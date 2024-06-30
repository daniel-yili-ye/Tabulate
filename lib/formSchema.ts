// lib/formSchema.ts
import * as z from "zod";

export const formSchema = z.object({
  mealName: z.string().min(1, "Meal name is required"),
  receiptImage: z.any().optional(),
  foodItems: z
    .array(
      z.object({
        item: z.string().min(1, "Item name is required"),
        price: z.number().multipleOf(0.01).nonnegative(),
      })
    )
    .min(1, "At least one food item is required"),
  tax: z.number().multipleOf(0.01).nonnegative().optional(),
  tip: z.number().multipleOf(0.01).nonnegative().optional(),
  discount: z.number().multipleOf(0.01).nonnegative().optional(),
  participants: z
    .array(z.string().min(1, "Participant name is required"))
    .min(2, "At least 2 participants are required"),
});

export type FormData = z.infer<typeof formSchema>;
