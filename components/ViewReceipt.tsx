import { ImageIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function ViewReceipt({
  receiptImage,
}: {
  receiptImage: string | undefined;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!receiptImage}>
          <ImageIcon />
          &nbsp;View Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-screen">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>Your receipt image</DialogDescription>
        </DialogHeader>
        {receiptImage && (
          <Image
            src={receiptImage}
            alt="Receipt"
            width={400}
            height={400}
            objectFit="contain"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
