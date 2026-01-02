import { Controller, useFormContext } from "react-hook-form";
import { useRef } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { Field, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FormData } from "@/lib/validation/formSchema";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/validation/formSchema";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

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
  details?: unknown;
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
    throw new Error(errorMessage);
  }

  return data;
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
  const uploadedFile = watch("stepReceiptUpload.image");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup the mutation
  const mutation = useMutation<
    ParseSuccessResponse,
    Error,
    File,
    { toastId?: string | number }
  >({
    mutationFn: parseReceiptImage,
    onMutate: () => {
      const toastId = toast.loading("Processing receipt...", {
        description:
          "Please do not refresh the page while we analyze your receipt.",
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
      if (data.Items?.length) {
        setValue("stepItems.Items", data.Items);
        setValue(
          "stepAllocateItems",
          data.Items.map(() => [])
        );
      }
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
    onSettled: () => {
      if (onProcessingStateChange) onProcessingStateChange(false);
    },
  });

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setValue("stepReceiptUpload.receiptImageURL", imageUrl);
    setValue("stepReceiptUpload.image", file);

    mutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue("stepReceiptUpload.receiptImageURL", undefined);
    setValue("stepReceiptUpload.image", undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current && !mutation.isPending) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      <Controller
        control={control}
        name="stepReceiptUpload.receiptImageURL"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div>
              {!uploadedFile ? (
                <div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    className="hidden"
                    disabled={mutation.isPending}
                    name={field.name}
                    onBlur={field.onBlur}
                  />
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={handleUploadAreaClick}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <Upload className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">
                          Upload a photo of your receipt
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse files
                        </p>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          JPG
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          JPEG
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          PNG
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg space-y-4">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-green-900 dark:text-green-100 truncate">
                            {uploadedFile.name}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            {mutation.isPending
                              ? "Processing..."
                              : "Ready to continue"}
                          </p>
                        </div>
                      </div>
                      {!mutation.isPending && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {receiptImageURL && (
                      <div className="rounded-md border overflow-hidden">
                        <Image
                          src={receiptImageURL}
                          alt="Receipt"
                          width={400}
                          height={400}
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}
