"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Summary from "@/features/bill-splitting/components/Summary";
import BillSkeleton from "@/features/bill-splitting/components/BillSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "@/features/bill-creation/schemas/formSchema";

interface BillApiResponse {
  success: boolean;
  data?: { form_data: FormData };
  error?: string;
}

async function fetchBillData(billId: string): Promise<{ form_data: FormData }> {
  const response = await fetch(`/api/tab?id=${billId}`);
  const data: BillApiResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.error || "Failed to load bill data");
  }

  return data.data;
}

export default function BillPage() {
  const params = useParams();
  const billId = params.id as string;

  const {
    data: billData,
    error,
    isLoading,
  } = useQuery<{ form_data: FormData }, Error>({
    queryKey: ["bill", billId],
    queryFn: () => fetchBillData(billId),
    enabled: !!billId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return <BillSkeleton />;
  }

  if (error || !billData?.form_data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
            <p className="mt-2">{error?.message || "Bill data not found"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <Summary formData={billData.form_data} billId={billId} />;
}
