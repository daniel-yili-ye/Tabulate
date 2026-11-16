import Link from "next/link";
import {
  ArrowRightIcon,
  CameraIcon,
  type LucideIcon,
  SendIcon,
  UsersIcon,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/features/tabs/format";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: CameraIcon,
    title: "Scan",
    body: "Snap the receipt. Items, tax and tip are read for you, and you can fix anything by hand.",
  },
  {
    icon: UsersIcon,
    title: "Assign",
    body: "Tap who had what. Share a dish evenly, by portions, by percent or by exact amounts.",
  },
  {
    icon: SendIcon,
    title: "Share",
    body: "Send one link with your payment note. Everyone sees their total, no app or account needed.",
  },
];

const EXAMPLE = [
  { name: "Maya", detail: "Margherita, ½ wine", cents: 3412 },
  { name: "Jordan", detail: "Rigatoni, ½ wine", cents: 3876 },
  { name: "Sam", detail: "Burrata, tiramisu", cents: 2759 },
];

function ExampleSplit() {
  const total = EXAMPLE.reduce((sum, person) => sum + person.cents, 0);

  return (
    <div className="w-full max-w-sm rounded-2xl border bg-card p-5 text-left shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="font-medium">Osteria Lupo</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatCents(total)}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">Tax and tip included</p>
      <ul className="mt-4 divide-y">
        {EXAMPLE.map((person) => (
          <li key={person.name} className="flex items-center gap-3 py-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {person.name[0]}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{person.name}</span>
              <span className="block text-xs text-muted-foreground">
                {person.detail}
              </span>
            </span>
            <span className="font-semibold tabular-nums">
              {formatCents(person.cents)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        Please e-transfer me at maya@example.com
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader className="max-w-5xl" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4">
        <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-28">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Split any receipt in under a minute.
            </h1>
            <p className="max-w-md text-lg text-pretty text-muted-foreground">
              Scan the bill, tap who had what, and send one link. Tabulate
              works out everyone&apos;s share of tax, tip and discounts, exact
              to the cent.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <Link href="/tabs/new">
                  Split a receipt
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Free. Your friends don&apos;t need an account.
              </p>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <ExampleSplit />
          </div>
        </section>

        <section aria-labelledby="how-it-works" className="border-t py-16">
          <h2
            id="how-it-works"
            className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
          >
            How it works
          </h2>
          <ol className="mt-8 grid gap-10 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl border bg-card">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-medium">{title}</h3>
                <p className="text-pretty text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">
          <p>Tabulate</p>
        </div>
      </footer>
    </>
  );
}
