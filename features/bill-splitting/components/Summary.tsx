import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <SummaryHeader
        businessName={formData.stepItems.businessName}
        date={formData.stepItems.date}
        receiptImageURL={formData.stepReceiptUpload.receiptImageURL}
        shareUrl={shareUrl || mutation.data?.shareUrl || fullUrl}
        fullUrl={fullUrl}
        onShare={handleShare}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isSaving={isSaving}
      />
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
