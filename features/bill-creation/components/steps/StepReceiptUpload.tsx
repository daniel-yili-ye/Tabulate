import { useFormContext } from "react-hook-form";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { FormData } from "@/features/bill-creation/schemas/formSchema";
import { ACCEPTED_IMAGE_TYPES } from "@/features/bill-creation/schemas/formSchema";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Define the expected API response structure for successful parse
interface ParseSuccessResponse {
  businessName?: string;
  date?: string; // API returns string, form expects Date
  Items?: { item: string; price?: number }[];
  tax?: number;
  tip?: number;
  discount?: number;
  total?: number;
}

// Define the structure for API errors
interface ParseErrorResponse {
  error: string;
  details?: any; // Optional: include if your API returns details
}

// Define the mutation function
async function parseReceiptImage(file: File): Promise<ParseSuccessResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/parse-image", {
    method: "POST",
    body: formData,
  });

  const data: ParseSuccessResponse | ParseErrorResponse = await response.json();

  if (!response.ok || "error" in data) {
    const errorMessage =
      "error" in data ? data.error : "Failed to process receipt";
    // You could potentially use data.details here if needed
    throw new Error(errorMessage);
  }

  return data; // Return only the success data
}

interface StepReceiptUploadProps {
  onProcessingSuccess?: () => void;
  onProcessingStateChange?: (isProcessing: boolean) => void;
}

export default function StepReceiptUpload({
  onProcessingSuccess,
  onProcessingStateChange,
}: StepReceiptUploadProps) {
  const { control, watch, setValue } = useFormContext<FormData>();
  const receiptImageURL = watch("stepReceiptUpload.receiptImageURL");

  // Setup the mutation
  const mutation = useMutation<
    ParseSuccessResponse, // Success type
    Error, // Error type
    File, // Input type
    { toastId?: string | number } // Context type
  >({
    mutationFn: parseReceiptImage,
    onMutate: () => {
      const toastId = toast.loading("Processing receipt...", {
        description: "Please wait while we analyze your receipt.",
      });
      if (onProcessingStateChange) onProcessingStateChange(true);
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      toast.success("Receipt processed successfully!", {
        id: context?.toastId,
        description: "The receipt details have been filled out for you.",
      });

      setValue("stepItems.businessName", data.businessName || "");
      if (data.date) setValue("stepItems.date", new Date(data.date));
      if (data.Items?.length) setValue("stepItems.Items", data.Items);
      if (data.tax) setValue("stepItems.tax", data.tax);
      if (data.tip) setValue("stepItems.tip", data.tip);
      if (data.discount) setValue("stepItems.discount", data.discount);
      if (data.total) setValue("stepItems.total", data.total);

      if (onProcessingSuccess) onProcessingSuccess();
    },
    onError: (error, _variables, context) => {
      console.error("Error processing receipt:", error);
      toast.error("Error processing receipt", {
        id: context?.toastId,
        description: error.message,
      });
    },
    onSettled: (_data, _error, _variables, context) => {
      // Called after mutation is successful or errors out
      // Ensures loading state is turned off
      if (onProcessingStateChange) onProcessingStateChange(false);
      // Toast dismissal/update is handled by onSuccess/onError via id
    },
  });

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setValue("stepReceiptUpload.receiptImageURL", imageUrl);
    setValue("stepReceiptUpload.image", file);

    mutation.mutate(file);
  };

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="stepReceiptUpload.receiptImageURL"
        render={({ field: { value, onChange, ...field } }) => (
          <FormItem>
            <FormControl>
              <Input
                type="file"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                disabled={mutation.isPending}
                {...field}
              />
            </FormControl>
            {receiptImageURL && (
              <div className="mt-4 rounded-md border p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Receipt uploaded successfully</span>
                </div>
                <Image
                  src={receiptImageURL}
                  alt="Receipt"
                  width={300}
                  height={300}
                  className="rounded-md"
                />
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
