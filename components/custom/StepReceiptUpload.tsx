// components/StepReceiptUpload.tsx
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import Image from "next/image";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import type { FormData } from "../../schema/formSchema";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Update the parent component when processing state changes
  const updateProcessingState = (state: boolean) => {
    setIsProcessing(state);
    if (onProcessingStateChange) {
      onProcessingStateChange(state);
    }
  };

  const handleFileChange = async (file: File | undefined) => {
    // Early return if no file
    if (!file) return;

    // Reset error state when a new file is uploaded
    setProcessingError(null);

    // Set the image in the form
    const imageUrl = URL.createObjectURL(file);
    setValue("stepReceiptUpload.receiptImageURL", imageUrl);
    setValue("stepReceiptUpload.image", file);

    // Process the receipt immediately
    await processReceipt(file);
  };

  const processReceipt = async (file: File | Blob) => {
    updateProcessingState(true);
    setProcessingError(null);

    // Create a unique toast ID to reference later
    const toastId = toast.loading("Processing receipt...", {
      description: "Please wait while we analyze your receipt.",
    });

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/parse-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process receipt");
      }

      // Successfully processed the receipt, update the form data
      toast.success("Receipt processed successfully!", {
        id: toastId, // Update the existing toast
        description: "The receipt details have been filled out for you.",
      });

      // Update the form with the parsed data
      setValue("stepItems.businessName", data.businessName || "");

      // Handle date - convert string to Date object if needed
      if (data.date) {
        setValue("stepItems.date", new Date(data.date));
      }

      // Handle items
      if (data.Items && Array.isArray(data.Items) && data.Items.length > 0) {
        setValue("stepItems.Items", data.Items);
      }

      // Handle optional fields
      if (data.tax) setValue("stepItems.tax", data.tax);
      if (data.tip) setValue("stepItems.tip", data.tip);
      if (data.discount) setValue("stepItems.discount", data.discount);
      if (data.total) setValue("stepItems.total", data.total);

      // Notify parent component that processing was successful
      if (onProcessingSuccess) {
        onProcessingSuccess();
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      setProcessingError(
        error instanceof Error ? error.message : "Failed to process receipt"
      );

      // Update the loading toast to an error toast
      toast.error("Error processing receipt", {
        id: toastId, // Update the existing toast
        description:
          error instanceof Error ? error.message : "Failed to process receipt",
      });
    } finally {
      updateProcessingState(false);
    }
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
                accept="image/*"
                disabled={isProcessing}
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

      {processingError && (
        <div className="text-destructive text-sm mt-2">{processingError}</div>
      )}
    </div>
  );
}
