"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** A receipt photo: either a saved public URL or a local blob: preview. */
export function ReceiptImage({ src, priority }: { src: string; priority?: boolean }) {
  return (
    <Image
      src={src}
      alt="Receipt"
      width={800}
      height={1200}
      sizes="(min-width: 640px) 28rem, 100vw"
      unoptimized={src.startsWith("blob:")}
      priority={priority}
      className="h-auto w-full rounded-md border"
    />
  );
}

export function ReceiptDialog({ src }: { src: string | null }) {
  if (!src) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ImageIcon data-icon="inline-start" />
          Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>The photo this tab was made from.</DialogDescription>
        </DialogHeader>
        <ReceiptImage src={src} />
      </DialogContent>
    </Dialog>
  );
}
