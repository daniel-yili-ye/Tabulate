"use client";

import { useRef, useState } from "react";
import { CameraIcon, Loader2Icon, Trash2Icon, XIcon } from "lucide-react";
import { ReceiptImage } from "@/components/receipt-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ScanStatus = "idle" | "uploading" | "reading";

const STATUS_LABEL: Record<Exclude<ScanStatus, "idle">, string> = {
  uploading: "Uploading photo…",
  reading: "Reading the receipt…",
};

interface ReceiptStepProps {
  status: ScanStatus;
  previewUrl: string | null;
  /** True when scanning would overwrite items the user already has. */
  hasItems: boolean;
  onScan: (file: File) => void;
  onCancel: () => void;
  onRemove: () => void;
}

export function ReceiptStep({
  status,
  previewUrl,
  hasItems,
  onScan,
  onCancel,
  onRemove,
}: ReceiptStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = status !== "idle";

  const pick = (file: File | undefined) => {
    if (file && !busy) onScan(file);
    // Allow choosing the same file again after a failed scan.
    if (inputRef.current) inputRef.current.value = "";
  };

  const busyNotice = (
    <span className="max-w-xs text-sm font-normal text-muted-foreground">
      This takes about 10 seconds. Please don&apos;t refresh or close this page.
    </span>
  );

  const cancelButton = (
    <Button type="button" variant="outline" size="sm" onClick={onCancel}>
      <XIcon data-icon="inline-start" />
      Cancel
    </Button>
  );

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => pick(event.target.files?.[0])}
      />

      {previewUrl ? (
        <div className="space-y-3">
          <div className="relative">
            <ReceiptImage src={previewUrl} priority />
            {busy && (
              <div
                role="status"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-background/80 px-4 text-center text-sm font-medium backdrop-blur-sm"
              >
                <Loader2Icon className="size-6 animate-spin" />
                {STATUS_LABEL[status]}
                {busyNotice}
                {cancelButton}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <CameraIcon data-icon="inline-start" />
              Use a different photo
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onRemove}
            >
              <Trash2Icon data-icon="inline-start" />
              Remove
            </Button>
          </div>
        </div>
      ) : busy ? (
        <div
          role="status"
          className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center"
        >
          <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
          <span className="font-medium">{STATUS_LABEL[status]}</span>
          {busyNotice}
          {cancelButton}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            pick(event.dataTransfer.files[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors outline-none hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            dragging && "border-ring bg-muted/50",
          )}
        >
          <CameraIcon className="size-10 text-muted-foreground" />
          <span className="text-lg font-medium">
            Take or upload a photo of the receipt
          </span>
          <span className="text-sm text-muted-foreground">
            We&apos;ll read the items, tax and tip for you.
          </span>
        </button>
      )}

      {hasItems && !busy && (
        <p className="text-sm text-muted-foreground">
          Scanning a new photo replaces the items you&apos;ve entered.
        </p>
      )}
    </div>
  );
}
