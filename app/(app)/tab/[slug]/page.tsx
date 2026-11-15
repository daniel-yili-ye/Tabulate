import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { Button } from "@/components/ui/button";
import { PaymentNote } from "@/features/tabs/components/payment-note";
import { ShareDialog } from "@/features/tabs/components/share-dialog";
import { TabSummary } from "@/features/tabs/components/tab-summary";
import { formatDate } from "@/features/tabs/format";
import { getSharedTab } from "@/features/tabs/queries";
import { computeSplit } from "@/features/tabs/split";
import { receiptImageUrl } from "@/lib/env";

export async function generateMetadata({
  params,
}: PageProps<"/tab/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tab = await getSharedTab(slug);
  if (!tab) return { title: "Tab not found", robots: { index: false } };

  const title = `${tab.businessName} · ${formatDate(tab.date)}`;
  const description = `See what you owe for ${tab.businessName}.`;
  return {
    title,
    description,
    // Share links are private to whoever holds them.
    robots: { index: false, follow: false },
    openGraph: { title, description },
  };
}

export default async function TabPage({
  params,
  searchParams,
}: PageProps<"/tab/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const tab = await getSharedTab(slug);
  if (!tab) notFound();

  const split = computeSplit(tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {tab.businessName}
          </h1>
          <p className="text-muted-foreground">{formatDate(tab.date, "long")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab.isOwner && (
            <Button asChild variant="outline">
              <Link href={`/tab/${tab.slug}/edit`}>
                <PencilIcon data-icon="inline-start" />
                Edit
              </Link>
            </Button>
          )}
          <ReceiptDialog
            src={tab.receiptImagePath ? receiptImageUrl(tab.receiptImagePath) : null}
          />
          <ShareDialog
            slug={tab.slug}
            businessName={tab.businessName}
            date={tab.date}
            paymentMessage={tab.paymentMessage}
            isOwner={tab.isOwner}
            defaultOpen={tab.isOwner && query.share === "1"}
          />
        </div>
      </div>

      <PaymentNote message={tab.paymentMessage} />
      <TabSummary tab={tab} split={split} />

      {!tab.isOwner && (
        <p className="text-center text-sm text-muted-foreground">
          Made with{" "}
          <Link href="/" className="font-medium text-foreground underline underline-offset-4">
            Tabulate
          </Link>
          . Split your own receipt in a minute.
        </p>
      )}
    </div>
  );
}
