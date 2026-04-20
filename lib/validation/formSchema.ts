import * as z from "zod";
const MAX_FILE_SIZE = 5000000;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const wizard1Schema = z.object({
  receiptImageURL: z.any().optional(),
  // Path to the image in Supabase storage (e.g., "temp/1234567890-abc123.jpg")
  imagePath: z.string().optional(),
  image: z
    .any()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      `Max image size is 5MB.`
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, and .png formats are supported."
    )
    .optional(),
});

// Base schema for receipt data (used by AI SDK structured output)
// This is a simple schema without transforms, compatible with AI SDK constraints
export const receiptBaseSchema = z.object({
  businessName: z
    .string()
    .nullable()
    .describe("The name of the business on the receipt"),
  date: z
    .string()
    .nullable()
    .describe("Transaction date in ISO format (YYYY-MM-DD), or null if not found"),
  Items: z
    .array(
      z.object({
        item: z.string().describe("Item name or description"),
        price: z
          .number()
          .nullable()
          .optional()
          .describe("Item price (null if unclear)"),
      })
    )
    .describe("List of all items purchased"),
  discount: z
    .number()
    .nullable()
    .optional()
    .describe("Discount amount if present"),
  tax: z
    .number()
    .nullable()
    .optional()
    .describe("Tax amount if present"),
  tip: z
    .number()
    .nullable()
    .optional()
    .describe("Tip amount if present"),
});

// Extended schema with transforms for form validation
export const wizard2Schema = receiptBaseSchema
  .extend({
    businessName: z.preprocess(
      (arg) => (arg === null || arg === undefined ? "" : arg),
      z.string()
    ),
    date: z
      .union([
        z.date({
          required_error: "A date is required",
        }),
        z.string().refine((dateString) => !isNaN(Date.parse(dateString)), {
          message: "Invalid date format",
        }),
        z.null(),
        z.undefined(),
      ])
      .transform((val) => {
        if (val === null || val === undefined) return new Date();
        if (val instanceof Date) return val;
        return new Date(val);
      }),
    Items: z
      .array(
        z.object({
          item: z.string().optional(),
          price: z.coerce.number().multipleOf(0.01).nonnegative().optional(),
        })
      )
      .transform((items) => {
        if (items.length === 0) {
          return [{ item: "", price: 0 }];
        }
        return items;
      }),
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
      id: z.number().int().positive(),
      name: z.string().min(1, "Participant name is required"),
    })
  )
  .min(2, "At least 2 participants are required");

// Split type options
export const splitTypeSchema = z.enum(["equal", "shares", "percentage", "custom"]);
export type SplitType = z.infer<typeof splitTypeSchema>;

// Item allocation schema with split type support
const itemAllocationSchema = z
  .object({
    splitType: splitTypeSchema.default("equal"),
    participantIds: z
      .array(z.number().int().positive())
      .min(1, "At least 1 participant must be selected"),
    // For "shares" split type - participantId -> number of shares
    shares: z.record(z.coerce.string(), z.number().int().positive()).optional(),
    // For "percentage" split type - participantId -> percentage (integers only, should sum to 100)
    percentages: z
      .record(z.coerce.string(), z.number().int().min(0).max(100))
      .optional(),
    // For "custom" split type - participantId -> dollar amount
    customAmounts: z
      .record(z.coerce.string(), z.number().nonnegative())
      .optional(),
  })
  .refine(
    (data) => {
      // Validate percentages sum to 100 when using percentage split
      if (data.splitType === "percentage" && data.percentages) {
        const sum = data.participantIds.reduce(
          (acc, id) => acc + (data.percentages?.[id] || 0),
          0
        );
        return sum === 100;
      }
      return true;
    },
    {
      message: "Percentages must sum to 100%",
      path: ["percentages"],
    }
  );

// Note: Custom amount validation is done at the form level since we need
// access to item prices which aren't stored in the allocation schema

export type ItemAllocation = z.infer<typeof itemAllocationSchema>;

const wizard4Schema = z.array(itemAllocationSchema);

export const formSchema = z.object({
  stepReceiptUpload: wizard1Schema,
  stepItems: wizard2Schema,
  stepParticipants: wizard3Schema,
  stepAllocateItems: wizard4Schema,
});

export type FormData = z.infer<typeof formSchema>;
