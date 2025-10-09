import { useState, useEffect } from "react";
import { FormData } from "@/lib/validation/formSchema";
import { BillAllocation } from "@/lib/validation/allocationSchema";
import { splitBill } from "@/lib/billing/billSplitter";

/**
 * Hook to calculate bill allocation from form data
 */
export const useBillAllocation = (formData: FormData) => {
  const [allocation, setAllocation] = useState<BillAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const calculateAllocation = () => {
      try {
        const result = splitBill(formData);
        console.log("Bill allocation calculated:", result);
        setAllocation(result);
        setError(null);
      } catch (err) {
        console.error("Error calculating bill split:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setAllocation(null);
      } finally {
        setIsLoading(false);
      }
    };

    calculateAllocation();
  }, [formData]);

  return { allocation, isLoading, error };
};

