"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Where the person was trying to go when they were stopped. */
type Destination = { kind: "link"; href: string } | { kind: "back" };

/**
 * Asks before leaving a page with unsaved work.
 *
 * Links inside the app and the browser's back button get a confirmation
 * dialog. A refresh or closing the browser tab can only show the browser's
 * own prompt; pages are not allowed to replace it.
 */
export function UnsavedChangesGuard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [destination, setDestination] = useState<Destination | null>(null);
  // Set while this component is itself moving through history.
  const skipPop = useRef(false);
  // Set once the person has confirmed going back, so that move goes through.
  const confirmedBack = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      // Other sites unload the page, which the browser prompt covers.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      // next/link leaves a click alone once its default is prevented.
      event.preventDefault();
      setDestination({ kind: "link", href: url.pathname + url.search + url.hash });
    };

    const onPopState = (event: PopStateEvent) => {
      if (confirmedBack.current) return;
      if (skipPop.current) {
        skipPop.current = false;
        // Hide our own step forward from the router; nothing really changed.
        event.stopImmediatePropagation();
        return;
      }
      // Stay on the page: keep the router from seeing this and undo the move.
      event.stopImmediatePropagation();
      skipPop.current = true;
      window.history.go(1);
      setDestination({ kind: "back" });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState, true);
    };
  }, [enabled]);

  const leave = () => {
    const target = destination;
    setDestination(null);
    if (!target) return;
    if (target.kind === "back") {
      confirmedBack.current = true;
      window.history.back();
    } else {
      router.push(target.href as Route);
    }
  };

  return (
    <AlertDialog
      open={destination !== null}
      onOpenChange={(open) => !open && setDestination(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>
            Your changes to this tab haven&apos;t been saved and will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={leave}>
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
