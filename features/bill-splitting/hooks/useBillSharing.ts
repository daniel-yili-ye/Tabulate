import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { FormData } from "@/lib/validation/formSchema";
import { BillAllocation } from "@/lib/validation/allocationSchema";

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

// Response from finalize endpoint
interface FinalizeResponse {
  success: boolean;
  newPath: string;
}

/**
 * Finalize the upload by moving from temp/ to permanent/ folder
 */
async function finalizeUpload(imagePath: string): Promise<string> {
  const response = await fetch("/api/upload/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagePath }),
  });

  if (!response.ok) {
    throw new Error("Failed to finalize upload");
  }

  const data: FinalizeResponse = await response.json();
  return data.newPath;
}

/**
 * Save bill to the database
 */
async function saveBill(input: SaveBillInput): Promise<SaveBillSuccessResponse> {
  const { formData, allocation } = input;

  // Create a deep copy of formData for modification
  let modifiedFormData = JSON.parse(JSON.stringify(formData));

  // Check if we have an imagePath from direct upload
  const imagePath = formData.stepReceiptUpload?.imagePath;

  if (imagePath && typeof imagePath === "string" && imagePath.startsWith("temp/")) {
    console.log("Finalizing upload - moving to permanent storage...");
    try {
      const permanentPath = await finalizeUpload(imagePath);
      modifiedFormData.stepReceiptUpload.imagePath = permanentPath;
      // Clear the blob URL and File object
      delete modifiedFormData.stepReceiptUpload.receiptImageURL;
      delete modifiedFormData.stepReceiptUpload.image;
    } catch (finalizeError) {
      console.error("Error finalizing upload:", finalizeError);
      toast.error("Failed to save receipt image. Bill not saved.");
      throw new Error("Image finalization failed");
    }
  } else {
    // Remove the File object before sending to API (not JSON serializable)
    if (modifiedFormData.stepReceiptUpload?.image) {
      delete modifiedFormData.stepReceiptUpload.image;
    }
    // Remove blob URLs (not useful for persistence)
    if (
      modifiedFormData.stepReceiptUpload?.receiptImageURL &&
      modifiedFormData.stepReceiptUpload.receiptImageURL.startsWith("blob:")
    ) {
      delete modifiedFormData.stepReceiptUpload.receiptImageURL;
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
