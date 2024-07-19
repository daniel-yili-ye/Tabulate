// lib/formSchema.ts
import * as z from "zod";

const wizardOneSchema = z.object({
  mealName: z.string().min(1, "Meal name is required"),
});

const wizardTwoSchema = z.object({
  receiptImage: z.any().optional(),
});

const wizardThreeSchema = z.object({
  foodItems: z
    .array(
      z.object({
        item: z.string().min(1, "Item name is required"),
        price: z.coerce.number().multipleOf(0.01).nonnegative().nullable(),
      })
    )
    .min(1, "At least one food item is required"),
  tax: z.coerce.number().multipleOf(0.01).nonnegative().optional().nullable(),
  tip: z.coerce.number().multipleOf(0.01).nonnegative().optional().nullable(),
  discount: z.coerce
    .number()
    .multipleOf(0.01)
    .nonnegative()
    .optional()
    .nullable(),
});

const wizardFourSchema = z
  .array(z.object({ name: z.string().min(1, "Participant name is required") }))
  .min(2, "At least 2 participants are required");

const wizardFiveSchema = z.array(
  z.object({
    foodItemIndex: z.number().int().nonnegative(),
    participantIndices: z
      .array(z.number().int().nonnegative())
      .min(1, "At least 1 participant must be selected"),
  })
);

export const formSchema = z.object({
  stepOne: wizardOneSchema,
  stepTwo: wizardTwoSchema,
  stepThree: wizardThreeSchema,
  stepFour: wizardFourSchema,
  stepFive: wizardFiveSchema,
});

export type FormData = z.infer<typeof formSchema>;
