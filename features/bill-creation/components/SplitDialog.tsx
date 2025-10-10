import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface CurrentSplitItem {
  index: number;
  item: string;
  price: number;
}

interface SplitDialogProps {
  open: boolean;
  splitCount: number;
  currentSplitItem: CurrentSplitItem | null;
  onSplitCountChange: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SplitDialog({
  open,
  splitCount,
  currentSplitItem,
  onSplitCountChange,
  onClose,
  onConfirm,
}: SplitDialogProps) {
  return (
    <Drawer open={open} onOpenChange={(state) => !state && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Split Item</DrawerTitle>
            <DrawerDescription>
              {`Split "${currentSplitItem?.item}" into multiple instances. The price will be divided equally.`}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onSplitCountChange(Math.max(2, splitCount - 1))}
                disabled={splitCount <= 2}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Decrease</span>
              </Button>
              <div className="flex-1 text-center">
                <div className="text-7xl font-bold tracking-tighter">
                  {splitCount}
                </div>
                <div className="text-muted-foreground text-[0.70rem] uppercase">
                  Items
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onSplitCountChange(Math.min(10, splitCount + 1))}
                disabled={splitCount >= 10}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Original price:</span>
                <span className="font-medium text-foreground">
                  ${Number(currentSplitItem?.price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Price per item:</span>
                <span className="font-medium text-foreground">
                  $
                  {splitCount > 0
                    ? (
                        Number(currentSplitItem?.price || 0) / splitCount
                      ).toFixed(2)
                    : "--"}
                </span>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={!(splitCount >= 2 && splitCount <= 10)}
            >
              Split Item
            </Button>
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
