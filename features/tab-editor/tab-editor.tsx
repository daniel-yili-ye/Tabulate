"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  FormProvider,
  useForm,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { Button } from "@/components/ui/button";
import { UnsavedChangesGuard } from "@/components/unsaved-changes-guard";
import {
  parseReceipt,
  removeReceipt,
  toJpeg,
  uploadReceipt,
} from "@/features/receipts/client";
import { saveTab } from "@/features/tabs/actions";
import { toIsoDate } from "@/features/tabs/format";
import { tabDraftSchema, type TabDraft } from "@/features/tabs/schema";
import { receiptImageUrl } from "@/lib/env";
import { newItem } from "./draft";
import { AssignStep } from "./steps/assign-step";
import { ItemsStep } from "./steps/items-step";
import { PaymentStep } from "./steps/payment-step";
import { PeopleStep } from "./steps/people-step";
import { ReceiptStep, type ScanStatus } from "./steps/receipt-step";

const STEPS = [
  {
    title: "Scan your receipt",
    description: "Add a photo and we'll read the items for you, or skip and type them in.",
  },
  {
    title: "Check the items",
    description: "Make sure the items and totals match the receipt.",
  },
  {
    title: "Who's splitting?",
    description: "Add everyone who is sharing this tab, including you.",
  },
  {
    title: "Who had what?",
    description: "Pick who shares each item and how it's divided.",
  },
  {
    title: "How should people pay?",
    description: "Add a note telling everyone how to pay you back.",
  },
] as const;

const ITEMS_STEP = 1;
const PEOPLE_STEP = 2;
const ASSIGN_STEP = 3;
const LAST_STEP = STEPS.length - 1;

/** The fields each step is responsible for, validated before moving on. */
function fieldsForStep(step: number, draft: TabDraft): FieldPath<TabDraft>[] {
  if (step === ITEMS_STEP) {
    return [
      "businessName",
      "date",
      "taxCents",
      "tipCents",
      "discountCents",
      ...draft.items.flatMap(
        (_, index) =>
          [`items.${index}.name`, `items.${index}.priceCents`] as const,
      ),
    ];
  }
  if (step === PEOPLE_STEP) return ["participants"];
  if (step === ASSIGN_STEP) return ["items"];
  return [];
}

/** After a failed save, the earliest step that has something to fix. */
function firstStepWithError(errors: FieldErrors<TabDraft>): number {
  const itemFieldError =
    Array.isArray(errors.items) &&
    errors.items.some((item) => item?.name || item?.priceCents);
  if (
    errors.businessName ||
    errors.date ||
    errors.taxCents ||
    errors.tipCents ||
    errors.discountCents ||
    itemFieldError
  ) {
    return ITEMS_STEP;
  }
  if (errors.participants) return PEOPLE_STEP;
  if (errors.items) return ASSIGN_STEP;
  return LAST_STEP;
}

interface TabEditorProps {
  userId: string;
  /** Null when creating a new tab. */
  slug: string | null;
  initialDraft: TabDraft;
}

export function TabEditor({ userId, slug, initialDraft }: TabEditorProps) {
  const isEditing = slug !== null;
  const form = useForm<TabDraft>({
    resolver: zodResolver(tabDraftSchema),
    mode: "onTouched",
    defaultValues: {
      ...initialDraft,
      date: initialDraft.date || toIsoDate(new Date()),
    },
  });

  const [step, setStep] = useState(isEditing ? ITEMS_STEP : 0);
  const [saving, startSaving] = useTransition();
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialDraft.receiptImagePath
      ? receiptImageUrl(initialDraft.receiptImagePath)
      : null,
  );
  // Photos uploaded in this session that no saved tab points to yet.
  const unsavedUploads = useRef(new Set<string>());
  const scanAbort = useRef<AbortController | null>(null);

  // Stop an in-flight scan if the editor is closed.
  useEffect(() => () => scanAbort.current?.abort(), []);

  const { isDirty } = form.formState;
  const scanning = scanStatus !== "idle";

  useEffect(() => {
    if (!previewUrl?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const goToStep = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  /** Delete a photo uploaded in this session that no saved tab points to. */
  const discardUpload = (path: string | null) => {
    if (path && unsavedUploads.current.delete(path)) void removeReceipt(path);
  };

  const attachReceipt = (path: string | null, preview: string | null) => {
    form.setValue("receiptImagePath", path, { shouldDirty: true });
    setPreviewUrl(preview);
  };

  const detachReceipt = () => {
    discardUpload(form.getValues("receiptImagePath"));
    attachReceipt(null, null);
  };

  const scan = async (file: File) => {
    const controller = new AbortController();
    scanAbort.current = controller;
    const { signal } = controller;
    const previousPath = form.getValues("receiptImagePath");
    let path: string | null = null;
    let attached = false;

    try {
      setScanStatus("uploading");
      const image = await toJpeg(file);
      signal.throwIfAborted();
      path = await uploadReceipt(image, userId);
      unsavedUploads.current.add(path);
      signal.throwIfAborted();

      attachReceipt(path, URL.createObjectURL(image));
      attached = true;
      setScanStatus("reading");
      const receipt = await parseReceipt(path, signal);

      const set = { shouldDirty: true };
      if (receipt.businessName) {
        form.setValue("businessName", receipt.businessName, set);
      }
      // A missing or future date falls back to today in the user's time zone.
      const today = toIsoDate(new Date());
      form.setValue(
        "date",
        receipt.date && receipt.date <= today ? receipt.date : today,
        set,
      );
      form.setValue("taxCents", receipt.taxCents, set);
      form.setValue("tipCents", receipt.tipCents, set);
      form.setValue("discountCents", receipt.discountCents, set);
      form.setValue("items", receipt.items.map((item) => newItem(item)), set);

      if (receipt.warning) toast.warning(receipt.warning, { duration: 10_000 });
      else toast.success("Receipt read. Give it a quick check.");
      goToStep(ITEMS_STEP);
    } catch (error) {
      if (signal.aborted) {
        // Cancelled: drop the new photo and put back whatever was there before.
        discardUpload(path);
        if (attached) {
          attachReceipt(
            previousPath,
            previousPath ? receiptImageUrl(previousPath) : null,
          );
        }
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Something went wrong. Try again.",
      );
    } finally {
      // The new photo replaced the old one, unless the scan was cancelled.
      if (!signal.aborted && path) discardUpload(previousPath);
      if (scanAbort.current === controller) {
        scanAbort.current = null;
        setScanStatus("idle");
      }
    }
  };

  const cancelScan = () => {
    scanAbort.current?.abort();
    scanAbort.current = null;
    setScanStatus("idle");
  };

  const next = async () => {
    const valid = await form.trigger(fieldsForStep(step, form.getValues()), {
      shouldFocus: true,
    });
    if (valid) goToStep(step + 1);
  };

  const save = form.handleSubmit(
    (draft) =>
      startSaving(async () => {
        // On success the action redirects to the tab and never returns.
        const result = await saveTab(slug, draft);
        if (result?.error) toast.error(result.error);
      }),
    (errors) => {
      const target = firstStepWithError(errors);
      if (target !== step) goToStep(target);
      toast.error("A few details need fixing before this can be saved.");
    },
  );

  const { title, description } = STEPS[step];

  return (
    <FormProvider {...form}>
      {/* Leaving would lose edits or interrupt a scan. Saving redirects by itself. */}
      <UnsavedChangesGuard enabled={(isDirty || scanning) && !saving} />
      <form onSubmit={(event) => event.preventDefault()} noValidate className="space-y-6">
        <div className="space-y-4">
          <div
            className="flex gap-1.5"
            role="progressbar"
            aria-label="Progress"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
          >
            {STEPS.map((stepInfo, index) => (
              <span
                key={stepInfo.title}
                className={`h-1 flex-1 rounded-full ${index <= step ? "bg-foreground" : "bg-muted"}`}
              />
            ))}
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            {step > 0 && <ReceiptDialog src={previewUrl} />}
          </div>
        </div>

        {step === 0 && (
          <ReceiptStep
            status={scanStatus}
            previewUrl={previewUrl}
            hasItems={form
              .getValues("items")
              .some((item) => item.name || item.priceCents)}
            onScan={scan}
            onCancel={cancelScan}
            onRemove={detachReceipt}
          />
        )}
        {step === ITEMS_STEP && <ItemsStep />}
        {step === PEOPLE_STEP && <PeopleStep />}
        {step === ASSIGN_STEP && <AssignStep />}
        {step === LAST_STEP && <PaymentStep />}

        <div className="flex justify-between gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className={step === 0 ? "invisible" : undefined}
            disabled={saving}
            onClick={() => goToStep(step - 1)}
          >
            <ChevronLeftIcon data-icon="inline-start" />
            Back
          </Button>

          {step === LAST_STEP ? (
            <Button type="button" disabled={saving} onClick={save}>
              {saving && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
              {isEditing ? "Save changes" : "Save and share"}
            </Button>
          ) : (
            <Button
              type="button"
              variant={step === 0 && !previewUrl ? "ghost" : "default"}
              disabled={scanning}
              onClick={next}
            >
              {step === 0 && !previewUrl ? "Enter items by hand" : "Next"}
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
