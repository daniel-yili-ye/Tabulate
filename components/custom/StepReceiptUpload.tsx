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
  FormDescription,
} from "../ui/form";
import { Input } from "../ui/input";
import type { FormData } from "../../schema/formSchema";
import { Loader2, CheckCircle2, Upload } from "lucide-react";
import { useToast } from "../hooks/use-toast";

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
  const { toast } = useToast();

  // Update the parent component when processing state changes
  const updateProcessingState = (state: boolean) => {
    setIsProcessing(state);
    if (onProcessingStateChange) {
      onProcessingStateChange(state);
    }
  };

  const handleFileChange = async (file: File | undefined) => {
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

    try {
      const formData = new FormData();
      formData.append("image", file);

      toast({
        title: "Processing receipt...",
        description: "Please wait while we analyze your receipt.",
      });

      const response = await fetch("/api/parse-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process receipt");
      }

      // Successfully processed the receipt, update the form data
      toast({
        title: "Receipt processed successfully!",
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
      if (data.tax !== undefined) setValue("stepItems.tax", data.tax);
      if (data.tip !== undefined) setValue("stepItems.tip", data.tip);
      if (data.discount !== undefined)
        setValue("stepItems.discount", data.discount);
      if (data.subtotal !== undefined)
        setValue("stepItems.subtotal", data.subtotal);
      if (data.total !== undefined) setValue("stepItems.total", data.total);

      // Notify parent component that processing was successful
      if (onProcessingSuccess) {
        onProcessingSuccess();
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      setProcessingError(
        error instanceof Error ? error.message : "Failed to process receipt"
      );
      toast({
        title: "Error processing receipt",
        description:
          error instanceof Error ? error.message : "Failed to process receipt",
        variant: "destructive",
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
            <FormLabel>Upload Receipt (optional)</FormLabel>
            <FormControl>
              <Input
                type="file"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                accept="image/*"
                disabled={isProcessing}
                {...field}
              />
            </FormControl>
            {isProcessing && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing receipt...</span>
              </div>
            )}
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
