"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LinkIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { copyText } from "@/lib/clipboard";
import { deleteTab } from "../actions";

export function TabRowMenu({ slug, businessName }: { slug: string; businessName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () =>
    startTransition(async () => {
      const result = await deleteTab(slug);
      if (result?.error) toast.error(result.error);
      else toast.success("Tab deleted");
      setConfirming(false);
    });

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          {/* Sits above the row's full-size link. */}
          <Button
            variant="ghost"
            size="icon"
            className="relative z-10"
            aria-label={`Actions for ${businessName}`}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto whitespace-nowrap">
          <DropdownMenuItem asChild>
            <Link href={`/tab/${slug}/edit`}>
              <PencilIcon />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              copyText(`${window.location.origin}/tab/${slug}`, "Link copied")
            }
          >
            <LinkIcon />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{businessName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The share link will stop working for everyone. This can&apos;t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {pending ? "Deleting…" : "Delete tab"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
