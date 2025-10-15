"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Summary from "@/features/bill-splitting/components/Summary";
import BillSkeleton from "@/features/bill-splitting/components/BillSkeleton";
import { FormData } from "@/lib/validation/formSchema";

interface BillApiResponse {
  success: boolean;
  data?: { form_data: FormData };
  error?: string;
}

async function fetchTabData(tabSlug: string): Promise<{ form_data: FormData }> {
  const response = await fetch(`/api/tab?slug=${tabSlug}`);
  const data: BillApiResponse = await response.json();

  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.error || "Failed to load tab data");
  }

  return data.data;
}

export default function BillPage() {
  const params = useParams();
  const tabSlug = params.slug as string;

  const {
    data: tabData,
    error,
    isLoading,
  } = useQuery<{ form_data: FormData }, Error>({
    queryKey: ["tab", tabSlug],
    queryFn: () => fetchTabData(tabSlug),
    enabled: !!tabSlug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return <BillSkeleton />;
  }

  if (error || !tabData?.form_data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">Error</h2>
        <p className="mt-2">{error?.message || "Tab data not found"}</p>
      </div>
    );
  }

  return <Summary formData={tabData.form_data} tabId={tabSlug} />;
}
