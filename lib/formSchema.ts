// lib/formSchema.ts
import * as z from "zod";

const wizardOneSchema = z.object({
  mealName: z.string().min(1, "Meal name is required"),
});

const wizardTwoSchema = z.object({
  receiptImage: z.any().optional(),
});

const wizardThreeSchema = z
  .object({
    restaurantName: z.string().min(1, "Restaurant name is required"),
    date: z.date({
      required_error: "A date is required",
    }),
    foodItems: z
      .array(
        z.object({
          item: z.string().min(1, "Item name is required"),
          price: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
        })
      )
      .min(1, "At least one food item is required"),
    tax: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
    tip: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
    discount: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
  })
  .transform((data) => ({
    ...data,
    subtotal: data.foodItems.reduce((sum, item) => sum + (item.price || 0), 0),
    total:
      data.foodItems.reduce((sum, item) => sum + (item.price || 0), 0) +
      (data.tax || 0) +
      (data.tip || 0) -
      (data.discount || 0),
  }));

const wizardFourSchema = z
  .array(
    z.object({
      id: z.string().uuid("Invalid UUID"),
      name: z.string().min(1, "Participant name is required"),
    })
  )
  .min(2, "At least 2 participants are required");

const wizardFiveSchema = z.array(
  z
    .array(z.string().uuid("Invalid UUID"))
    .min(1, "At least 1 participant must be selected")
);

export const formSchema = z.object({
  stepOne: wizardOneSchema,
  stepTwo: wizardTwoSchema,
  stepThree: wizardThreeSchema,
  stepFour: wizardFourSchema,
  stepFive: wizardFiveSchema,
});

export type FormData = z.infer<typeof formSchema>;
