import { CheckIcon, ReceiptTextIcon, Undo2Icon } from "lucide-react";
import { Totals } from "@/components/amount-rows";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCents } from "../format";
import type { PersonSplit, SplitInput, SplitResult } from "../split";

function SummaryCard({
  value,
  avatar,
  title,
  subtitle,
  totalCents,
  currency,
  paid = false,
  action,
  children,
}: {
  value: string;
  avatar: React.ReactNode;
  title: string;
  subtitle: string;
  totalCents: number;
  currency: string;
  paid?: boolean;
  /** Shown under the header whether or not the card is open. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className={cn(
        "rounded-xl border px-4 transition-colors last:border-b",
        paid &&
          "border-emerald-600/30 bg-emerald-500/10 dark:border-emerald-500/30",
      )}
    >
      <AccordionTrigger className="items-center gap-3 py-3 hover:no-underline">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium uppercase">
          {avatar}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{title}</span>
            {paid && (
              <Badge className="bg-emerald-600 text-white dark:bg-emerald-600">
                <CheckIcon />
                Paid
              </Badge>
            )}
          </span>
          <span className="block text-sm font-normal text-muted-foreground">
            {subtitle}
          </span>
        </span>
        <span className="text-lg font-semibold tabular-nums">
          {formatCents(totalCents, currency)}
        </span>
      </AccordionTrigger>
      {action && <div className="pb-3">{action}</div>}
      <AccordionContent className="space-y-3 pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

function LineItems({
  lines,
  currency,
}: {
  lines: { key: string; name: string; note?: string; cents: number }[];
  currency: string;
}) {
  return (
    <ul className="divide-y text-sm">
      {lines.map((line) => (
        <li key={line.key} className="flex items-start justify-between gap-4 py-2">
          <span>
            <span className="block">{line.name}</span>
            {line.note && (
              <span className="block text-xs text-muted-foreground">{line.note}</span>
            )}
          </span>
          <span className="font-medium tabular-nums">{formatCents(line.cents, currency)}</span>
        </li>
      ))}
    </ul>
  );
}

interface PersonCardProps {
  person: PersonSplit;
  currency: string;
  paid: boolean;
  /** Absent when the viewer may not change who has paid. */
  onPaidChange?: (paid: boolean) => void;
}

function PersonCard({ person, currency, paid, onPaidChange }: PersonCardProps) {
  const count = person.items.length;

  return (
    <SummaryCard
      value={person.id}
      avatar={person.name[0]}
      title={person.name}
      subtitle={`${count} item${count === 1 ? "" : "s"}`}
      totalCents={person.totalCents}
      currency={currency}
      paid={paid}
      action={
        onPaidChange &&
        (paid ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => onPaidChange(false)}
          >
            <Undo2Icon data-icon="inline-start" />
            Mark as not paid
          </Button>
        ) : (
          <Button className="w-full" onClick={() => onPaidChange(true)}>
            <CheckIcon data-icon="inline-start" />
            Mark as paid
          </Button>
        ))
      }
    >
      <LineItems
        currency={currency}
        lines={person.items.map((item, index) => ({
          key: `${index}`,
          name: item.name,
          note:
            item.sharedBy > 1
              ? `${formatCents(item.priceCents, currency)} shared by ${item.sharedBy}`
              : undefined,
          cents: item.cents,
        }))}
      />
      <Totals
        subtotalLabel="Items"
        subtotalCents={person.subtotalCents}
        discountCents={person.discountCents}
        taxCents={person.taxCents}
        tipCents={person.tipCents}
        totalCents={person.totalCents}
        currency={currency}
      />
    </SummaryCard>
  );
}

interface TabSummaryProps {
  tab: SplitInput;
  split: SplitResult;
  /** The currency `tab` and `split` are in. */
  currency: string;
  /** Ids of the people who have paid their share. */
  paidIds: readonly string[];
  /** Absent when the viewer may not change who has paid. */
  onPaidChange?: (participantId: string, paid: boolean) => void;
}

/** Everyone's totals plus the full receipt, as expandable cards. */
export function TabSummary({
  tab,
  split,
  currency,
  paidIds,
  onPaidChange,
}: TabSummaryProps) {
  return (
    <Accordion type="multiple" className="space-y-3">
      {split.people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          currency={currency}
          paid={paidIds.includes(person.id)}
          onPaidChange={
            onPaidChange && ((paid: boolean) => onPaidChange(person.id, paid))
          }
        />
      ))}
      <SummaryCard
        value="receipt"
        avatar={<ReceiptTextIcon className="size-5" />}
        title="Full receipt"
        subtitle={`${tab.items.length} item${tab.items.length === 1 ? "" : "s"}`}
        totalCents={split.totalCents}
        currency={currency}
      >
        <LineItems
          currency={currency}
          lines={tab.items.map((item, index) => ({
            key: `${index}`,
            name: item.name || `Item ${index + 1}`,
            cents: item.priceCents,
          }))}
        />
        <Totals
          subtotalCents={split.subtotalCents}
          discountCents={tab.discountCents}
          taxCents={tab.taxCents}
          tipCents={tab.tipCents}
          totalCents={split.totalCents}
          currency={currency}
        />
      </SummaryCard>
    </Accordion>
  );
}
