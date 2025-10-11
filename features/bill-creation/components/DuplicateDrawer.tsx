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

interface CurrentDuplicateItem {
  index: number;
  item: string;
  price: number;
}

interface DuplicateDrawerProps {
  open: boolean;
  duplicateCount: number;
  currentDuplicateItem: CurrentDuplicateItem | null;
  onDuplicateCountChange: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DuplicateDrawer({
  open,
  duplicateCount,
  currentDuplicateItem,
  onDuplicateCountChange,
  onClose,
  onConfirm,
}: DuplicateDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(state) => !state && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Duplicate Item</DrawerTitle>
            <DrawerDescription>
              {`Create ${duplicateCount} copies of "${currentDuplicateItem?.item}". Each copy will have the same price.`}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() =>
                  onDuplicateCountChange(Math.max(1, duplicateCount - 1))
                }
                disabled={duplicateCount <= 1}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Decrease</span>
              </Button>
              <div className="flex-1 text-center">
                <div className="text-7xl font-bold tracking-tighter">
                  {duplicateCount}
                </div>
                <div className="text-muted-foreground text-[0.70rem] uppercase">
                  Copies
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() =>
                  onDuplicateCountChange(Math.min(10, duplicateCount + 1))
                }
                disabled={duplicateCount >= 10}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Increase</span>
              </Button>
            </div>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Price per item:</span>
                <span className="font-medium text-foreground">
                  ${Number(currentDuplicateItem?.price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total price:</span>
                <span className="font-medium text-foreground">
                  $
                  {(
                    Number(currentDuplicateItem?.price || 0) * duplicateCount
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={!(duplicateCount >= 1 && duplicateCount <= 10)}
            >
              Duplicate Item
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
