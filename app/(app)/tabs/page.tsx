import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ReceiptTextIcon,
  SearchXIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TabFilters } from "@/features/tabs/components/tab-filters";
import { TabRowMenu } from "@/features/tabs/components/tab-row-menu";
import { formatCents, formatDate, parseIsoDate } from "@/features/tabs/format";
import { LIMITS } from "@/features/tabs/limits";
import { listMyTabs } from "@/features/tabs/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your tabs" };

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

const isoDate = (value: string) => (parseIsoDate(value) ? value : "");

function NewTabButton({ label = "New tab" }: { label?: string }) {
  return (
    <Button asChild>
      <Link href="/tabs/new">
        <PlusIcon data-icon="inline-start" />
        {label}
      </Link>
    </Button>
  );
}

export default async function TabsPage({ searchParams }: PageProps<"/tabs">) {
  await requireUser("/tabs");

  const params = await searchParams;
  const filters = {
    search: first(params.q).trim().slice(0, LIMITS.businessNameLength),
    from: isoDate(first(params.from)),
    to: isoDate(first(params.to)),
  };
  const filtered = Boolean(filters.search || filters.from || filters.to);
  const requestedPage = Number.parseInt(first(params.page), 10);

  const { tabs, total, page, pageCount } = await listMyTabs({
    ...filters,
    page: Number.isSafeInteger(requestedPage) ? requestedPage : 1,
  });

  if (total === 0 && !filtered) {
    return (
      <Empty className="mt-10 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptTextIcon />
          </EmptyMedia>
          <EmptyTitle>No tabs yet</EmptyTitle>
          <EmptyDescription>
            Scan a receipt and you&apos;ll have a shareable split in about a
            minute.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NewTabButton label="Split a receipt" />
        </EmptyContent>
      </Empty>
    );
  }

  const pageHref = (target: number) => ({
    pathname: "/tabs" as const,
    query: {
      ...(filters.search && { q: filters.search }),
      ...(filters.from && { from: filters.from }),
      ...(filters.to && { to: filters.to }),
      ...(target > 1 && { page: target }),
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Your tabs</h1>
        <NewTabButton />
      </div>

      <TabFilters applied={filters} />

      {tabs.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>No tabs match</EmptyTitle>
            <EmptyDescription>
              Try a different name or a wider date range.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-y rounded-xl border">
          {tabs.map((tab) => (
            <li key={tab.slug} className="relative flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/tab/${tab.slug}`}
                  className="block truncate font-medium after:absolute after:inset-0"
                >
                  {tab.businessName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatDate(tab.date)} · {tab.people} people
                  {tab.paid > 0 &&
                    (tab.paid === tab.people ? (
                      <span className="font-medium text-emerald-600 dark:text-emerald-500">
                        {" "}
                        · Settled
                      </span>
                    ) : (
                      ` · ${tab.paid} of ${tab.people} paid`
                    ))}
                </p>
              </div>
              <span className="font-semibold tabular-nums">
                {formatCents(tab.totalCents, tab.currency)}
              </span>
              <TabRowMenu slug={tab.slug} businessName={tab.businessName} />
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-4">
          <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1}>
            {page > 1 ? (
              <Link href={pageHref(page - 1)}>
                <ChevronLeftIcon data-icon="inline-start" />
                Previous
              </Link>
            ) : (
              <>
                <ChevronLeftIcon data-icon="inline-start" />
                Previous
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground tabular-nums">
            Page {page} of {pageCount} · {total} tabs
          </p>
          <Button
            asChild={page < pageCount}
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
          >
            {page < pageCount ? (
              <Link href={pageHref(page + 1)}>
                Next
                <ChevronRightIcon data-icon="inline-end" />
              </Link>
            ) : (
              <>
                Next
                <ChevronRightIcon data-icon="inline-end" />
              </>
            )}
          </Button>
        </nav>
      )}
    </div>
  );
}
