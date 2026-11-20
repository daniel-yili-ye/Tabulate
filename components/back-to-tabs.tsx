import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The way back to the tab list, for the top of a signed-in page. */
export function BackToTabs() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2.5">
      <Link href="/tabs">
        <ChevronLeftIcon data-icon="inline-start" />
        Your tabs
      </Link>
    </Button>
  );
}
