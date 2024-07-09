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
        price: z.coerce.number().multipleOf(0.01).nonnegative(),
      })
    )
    .min(1, "At least one food item is required"),
  tax: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
  tip: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
  discount: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
});

const wizardFourSchema = z
  .array(z.object({ name: z.string().min(1, "Participant name is required") }))
  .min(2, "At least 2 participants are required");

const wizardFiveSchema = z.array(
  z.object({
    persons: z
      .array(z.string())
      .refine((value) => value.some((person) => person), {
        message: "You have to select at least one person.",
      }),
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
