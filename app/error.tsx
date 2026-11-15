"use client";

import { useEffect } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <TriangleAlertIcon className="size-10 text-muted-foreground" />
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">
        That didn&apos;t load properly. Try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
