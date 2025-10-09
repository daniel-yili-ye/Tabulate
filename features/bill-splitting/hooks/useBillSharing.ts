import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormData } from "@/lib/validation/formSchema";
import { BillAllocation } from "@/lib/validation/allocationSchema";
import { uploadReceiptImage } from "@/lib/supabase/client";

// Define expected success response from /api/tab POST
interface SaveBillSuccessResponse {
  success: boolean;
  billId: string;
  shareUrl: string;
}

// Define potential error response
interface SaveBillErrorResponse {
  success: boolean;
  error: string;
  details?: any;
}

// Define the input type for the mutation
interface SaveBillInput {
  formData: FormData;
  allocation: BillAllocation | null;
}

/**
 * Save bill to the database
 */
async function saveBill(input: SaveBillInput): Promise<SaveBillSuccessResponse> {
  const { formData, allocation } = input;

  // Create a deep copy of formData for modification
  let modifiedFormData = JSON.parse(JSON.stringify(formData));

  // Check if we need to upload the image to Supabase
  const receiptImageURL = formData.stepReceiptUpload?.receiptImageURL;
  const receiptImage = formData.stepReceiptUpload?.image;

  // Check specifically for blob URLs and ensure image is a File
  if (
    typeof receiptImageURL === "string" &&
    receiptImageURL.startsWith("blob:") &&
    receiptImage instanceof File
  ) {
    console.log("Uploading blob image to Supabase...");
    try {
      const permanentUrl = await uploadReceiptImage(receiptImage);
      modifiedFormData.stepReceiptUpload.receiptImageURL = permanentUrl;
      delete modifiedFormData.stepReceiptUpload.image;
    } catch (uploadError) {
      console.error("Error uploading image to Supabase:", uploadError);
      toast.error("Failed to upload receipt image. Bill not saved.");
      throw new Error("Image upload failed");
    }
  } else {
    // If not uploading a blob, still remove potential File object before sending to API
    if (modifiedFormData.stepReceiptUpload?.image) {
      delete modifiedFormData.stepReceiptUpload.image;
    }
  }

  // Prepare the data to save
  const tabData = {
    form_data: modifiedFormData,
    allocation,
  };

  console.log("Sending bill data to API:", tabData);

  // Send data to API route
  const response = await fetch("/api/tab", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tabData),
  });

  const data: SaveBillSuccessResponse | SaveBillErrorResponse =
    await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      (data as SaveBillErrorResponse).error || "Failed to save bill data"
    );
  }

  return data as SaveBillSuccessResponse;
}

/**
 * Hook to manage bill sharing functionality
 */
export const useBillSharing = (
  formData: FormData,
  allocation: BillAllocation | null,
  billId?: string
) => {
  const [fullUrl, setFullUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFullUrl(window.location.href);
    }
  }, []);

  const mutation = useMutation<SaveBillSuccessResponse, Error, SaveBillInput>({
    mutationFn: saveBill,
    onSuccess: (data) => {
      setShareUrl(data.shareUrl);
    },
    onError: (error) => {
      console.error("Error saving bill data:", error);
      toast.error(error.message || "Failed to generate share link");
    },
  });

  const handleShare = async (): Promise<void> => {
    setIsOpen(true);

    // Early return if we already have a share URL
    if (shareUrl || mutation.data?.shareUrl) {
      setShareUrl(shareUrl || mutation.data!.shareUrl);
      console.log("Share URL already exists or generated.");
      return;
    }

    // Early return if we have a billId from props (viewing an existing bill)
    if (billId) {
      const existingShareUrl = `${window.location.origin}/tab/${billId}`;
      setShareUrl(existingShareUrl);
      console.log("Using existing billId for share URL.");
      return;
    }

    // Trigger the mutation if we don't have a URL
    if (!allocation) {
      console.error("Allocation not calculated yet, cannot save.");
      toast.error("Cannot generate link until allocation is calculated.");
      setIsOpen(false);
      return;
    }

    mutation.mutate({ formData, allocation });
  };

  return {
    shareUrl,
    fullUrl,
    isOpen,
    setIsOpen,
    handleShare,
    isSaving: mutation.isPending,
    mutation,
  };
};

