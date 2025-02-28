import { ImageIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export default function ViewReceipt({
  receiptImageURL,
}: {
  receiptImageURL: string | undefined;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!receiptImageURL}>
          <ImageIcon />
          &nbsp;View Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>Your receipt image</DialogDescription>
        </DialogHeader>
        {receiptImageURL && (
          <Image src={receiptImageURL} alt="Receipt" width={400} height={400} />
        )}
      </DialogContent>
    </Dialog>
  );
}
