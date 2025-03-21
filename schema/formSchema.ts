import * as z from "zod";
const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const wizard1Schema = z.object({
  receiptImageURL: z.any().optional(),
  image: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    )
    .optional(),
});

const wizard2Schema = z
  .object({
    businessName: z.string().min(1, "Business name is required"),
    date: z
      .union([
        z.date({
          required_error: "A date is required",
        }),
        z.string().refine((dateString) => !isNaN(Date.parse(dateString)), {
          message: "Invalid date format",
        }),
      ])
      .transform((val) => {
        if (val instanceof Date) return val;
        return new Date(val);
      }),
    Items: z
      .array(
        z.object({
          item: z.string().min(1, "Item name is required"),
          price: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
        })
      )
      .min(1, "At least one Item is required"),
    tax: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
    tip: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
    discount: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
  })
  .transform((data) => ({
    ...data,
    subtotal: data.Items.reduce((sum, item) => sum + (item.price || 0), 0),
    total:
      data.Items.reduce((sum, item) => sum + (item.price || 0), 0) +
      (data.tax || 0) +
      (data.tip || 0) -
      (data.discount || 0),
  }));

const wizard3Schema = z
  .array(
    z.object({
      id: z.string().uuid("Invalid UUID"),
      name: z.string().min(1, "Participant name is required"),
    })
  )
  .min(2, "At least 2 participants are required");

const wizard4Schema = z.array(
  z
    .array(z.string().uuid("Invalid UUID"))
    .min(1, "At least 1 participant must be selected")
);

export const formSchema = z.object({
  stepReceiptUpload: wizard1Schema,
  stepItems: wizard2Schema,
  stepParticipants: wizard3Schema,
  stepAllocateItems: wizard4Schema,
});

export type FormData = z.infer<typeof formSchema>;
