import { useMemo } from "react";
import { FormData } from "@/lib/validation/formSchema";
import { Loader2 } from "lucide-react";
import { useBillAllocation } from "../hooks/useBillAllocation";
import { useBillSharing } from "../hooks/useBillSharing";
import { calculateBillTotals } from "../utils/billCalculations";
import SummaryHeader from "./SummaryHeader";
import AllocationTable from "./AllocationTable";

interface SummaryProps {
  formData: FormData;
  tabId?: string;
}

export default function Summary({ formData, tabId }: SummaryProps) {
  // Get receipt image URL - either from blob URL (during creation) or construct from imagePath (saved tab)
  const receiptImageURL = useMemo(() => {
    // If we have a blob URL from the current session, use it
    if (formData.stepReceiptUpload.receiptImageURL) {
      return formData.stepReceiptUpload.receiptImageURL;
    }
    // If we have an imagePath (from saved tab), construct the public URL
    if (formData.stepReceiptUpload.imagePath) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipt-images/${formData.stepReceiptUpload.imagePath}`;
    }
    return undefined;
  }, [formData.stepReceiptUpload.receiptImageURL, formData.stepReceiptUpload.imagePath]);

  // Calculate allocation using custom hook
  const { allocation, isLoading, error } = useBillAllocation(formData);

  // Calculate totals
  const { subtotal, total } = useMemo(
    () => calculateBillTotals(formData),
    [formData]
  );

  // Handle sharing using custom hook
  const {
    shareUrl,
    fullUrl,
    isOpen,
    setIsOpen,
    handleShare,
    isSaving,
    mutation,
  } = useBillSharing(formData, allocation, tabId);

  return (
    <div className="space-y-6">
      <SummaryHeader
        businessName={formData.stepItems.businessName}
        date={formData.stepItems.date}
        receiptImageURL={receiptImageURL}
        shareUrl={shareUrl || mutation.data?.shareUrl || fullUrl}
        fullUrl={fullUrl}
        onShare={handleShare}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isSaving={isSaving}
      />
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error || !allocation ? (
          <p>Error calculating bill split. Please try again.</p>
        ) : (
          <AllocationTable
            allocation={allocation}
            formData={formData}
            total={total}
          />
        )}
      </div>
    </div>
  );
}
