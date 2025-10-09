import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onClose() : undefined)}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Split Item</DialogTitle>
          <DialogDescription>
            {`Split "${currentSplitItem?.item}" into multiple instances. The price will be divided equally.`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="split-count" className="text-sm font-medium">
              Split into:
            </Label>
            <Input
              id="split-count"
              type="number"
              inputMode="numeric"
              min="2"
              max="50"
              value={splitCount}
              onChange={(e) =>
                onSplitCountChange(parseInt(e.target.value) || 2)
              }
              className="col-span-3"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Original price: {Number(currentSplitItem?.price || 0).toFixed(2)}
            <br />
            Price per item:{" "}
            {splitCount > 0
              ? (Number(currentSplitItem?.price || 0) / splitCount).toFixed(2)
              : "--"}
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!(splitCount >= 2 && splitCount <= 50)}
          >
            Split Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

