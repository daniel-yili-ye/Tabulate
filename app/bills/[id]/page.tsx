"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Summary from "@/components/custom/Summary";
import BillSkeleton from "@/components/custom/BillSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { FormData } from "@/schema/formSchema";

export default function BillPage() {
  const params = useParams();
  const billId = params.id as string;
  const [billData, setBillData] = useState<{ form_data: FormData } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBillData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/bills?id=${billId}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to load bill data");
        }

        setBillData(data.data);
      } catch (err) {
        console.error("Error fetching bill:", err);
        setError(err instanceof Error ? err.message : "Failed to load bill");
      } finally {
        setLoading(false);
      }
    }

    if (billId) {
      fetchBillData();
    }
  }, [billId]);

  if (loading) {
    return <BillSkeleton />;
  }

  if (error || !billData?.form_data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive">Error</h2>
            <p className="mt-2">{error || "Bill data not found"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <Summary formData={billData.form_data} billId={billId} />;
}
