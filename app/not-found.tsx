import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/supabase/server";

export default async function NotFound() {
  const user = await getUser();

  return (
    <>
      <SiteHeader user={user ?? undefined} className="max-w-5xl" />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <SearchXIcon className="size-10 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">
          We couldn&apos;t find that
        </h1>
        <p className="max-w-sm text-muted-foreground">
          The tab may have been deleted, or the link might be incomplete.
        </p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </main>
    </>
  );
}
