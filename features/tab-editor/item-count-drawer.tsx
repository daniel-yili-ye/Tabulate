"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { AmountRow } from "@/components/amount-rows";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { TabItem } from "@/features/tabs/schema";

const MODES = {
  split: {
    title: "Split item",
    describe: (name: string) =>
      `Divide “${name}” into separate items with the price shared equally.`,
    unit: "parts",
    min: 2,
    confirm: "Split item",
  },
  duplicate: {
    title: "Duplicate item",
    describe: (name: string) => `Add more copies of “${name}” at the same price.`,
    unit: "extra copies",
    min: 1,
    confirm: "Duplicate item",
  },
} as const;

const MAX = 10;

export type ItemCountMode = keyof typeof MODES;

export interface ItemCountRequest {
  /** Changes on every request so the stepper starts fresh each time. */
  id: number;
  mode: ItemCountMode;
  item: TabItem;
}

interface ItemCountDrawerProps {
  open: boolean;
  /** The last thing asked for. Kept while the drawer animates closed. */
  request: ItemCountRequest | null;
  onConfirm: (count: number) => void;
  onClose: () => void;
}

/**
 * Stepper drawer used for both "split into N" and "duplicate N times".
 *
 * It stays mounted and is opened and closed through `open`. Unmounting it
 * while open would skip the drawer's cleanup and leave the page locked
 * (`pointer-events: none` on the body), which freezes the whole UI.
 */
export function ItemCountDrawer({ open, request, onConfirm, onClose }: ItemCountDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent>
        {request && (
          <ItemCountBody
            key={request.id}
            request={request}
            onConfirm={onConfirm}
            onClose={onClose}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function ItemCountBody({
  request: { mode, item },
  onConfirm,
  onClose,
}: Pick<ItemCountDrawerProps, "onConfirm" | "onClose"> & { request: ItemCountRequest }) {
  const config = MODES[mode];
  const [count, setCount] = useState<number>(config.min);
  const name = item.name || "this item";

  return (
    <div className="mx-auto w-full max-w-sm">
      <DrawerHeader>
        <DrawerTitle>{config.title}</DrawerTitle>
        <DrawerDescription>{config.describe(name)}</DrawerDescription>
      </DrawerHeader>

      <div className="space-y-6 px-4">
        <div className="flex items-center justify-center gap-6">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            aria-label="Decrease"
            disabled={count <= config.min}
            onClick={() => setCount(count - 1)}
          >
            <MinusIcon />
          </Button>
          <div className="w-24 text-center">
            <div className="text-6xl font-semibold tabular-nums" aria-live="polite">
              {count}
            </div>
            <div className="text-xs text-muted-foreground uppercase">
              {config.unit}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            aria-label="Increase"
            disabled={count >= MAX}
            onClick={() => setCount(count + 1)}
          >
            <PlusIcon />
          </Button>
        </div>

        <div className="space-y-1">
          <AmountRow label="Item price" cents={item.priceCents} />
          {mode === "split" ? (
            <AmountRow
              label="Price per part"
              cents={Math.floor(item.priceCents / count)}
            />
          ) : (
            <AmountRow
              label="Added to the tab"
              cents={item.priceCents * count}
            />
          )}
        </div>
      </div>

      <DrawerFooter>
        <Button type="button" onClick={() => onConfirm(count)}>
          {config.confirm}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </DrawerFooter>
    </div>
  );
}
