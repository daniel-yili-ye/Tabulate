import { FormData } from "@/lib/validation/formSchema";

/**
 * Calculate subtotal and total from form data
 */
export const calculateBillTotals = (formData: FormData) => {
  const subtotal = formData.stepItems.Items.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0
  );
  const total =
    subtotal +
    (Number(formData.stepItems.tax) || 0) +
    (Number(formData.stepItems.tip) || 0) -
    (Number(formData.stepItems.discount) || 0);
  
  return { subtotal, total };
};

