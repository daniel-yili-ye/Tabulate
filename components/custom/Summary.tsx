"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { FormData } from "@/schema/formSchema";
import {
  splitBill,
  BillAllocation,
  PersonAllocation,
} from "@/utils/billSplitter";
import { Loader2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import ViewReceipt from "./ViewReceipt";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import ShareModal from "./ShareModal";
import { uploadReceiptImage } from "@/utils/supabase";

export default function Summary({
  formData,
  billId,
}: {
  formData: FormData;
  billId?: string;
}) {
  const [fullUrl, setFullUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [allocation, setAllocation] = useState<BillAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const currentDate = formData.stepItems.date;

  const dateObject =
    typeof currentDate === "string" ? new Date(currentDate) : currentDate;

  const formattedDate = dateObject.toLocaleString(
    "en-US",
    options as Intl.DateTimeFormatOptions
  );

  const roundCents = (amount: number | undefined) => {
    if (amount === undefined || isNaN(amount)) return "0.00";
    return (amount ? Math.round(amount * 100) / 100 : 0).toFixed(2);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFullUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    const calculateAllocation = async () => {
      try {
        const result = await splitBill(formData);
        console.log(result);
        setAllocation(result);
      } catch (error) {
        console.error("Error calculating bill split:", error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateAllocation();
  }, [formData]);

  const calculateTotals = useMemo(() => {
    const subtotal = formData.stepItems.Items.reduce(
      (sum, item) => sum + (Number(item.price) || 0),
      0
    );
    const total =
      subtotal +
      (Number(formData.stepItems.tax) || 0) +
      (Number(formData.stepItems.tip) || 0) -
      (Number(formData.stepItems.discount) || 0);
    return { subtotal, total };
  }, [formData.stepItems]);

  const ItemizedBreakdownModal = ({ person }: { person: PersonAllocation }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{person.name}</DialogTitle>
          <DialogDescription>Itemized Tab</DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Calculation</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {person.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.item}</TableCell>
                <TableCell className="text-right">
                  {roundCents(item.fullPrice)} / {item.participants}
                </TableCell>
                <TableCell className="text-right">
                  {roundCents(item.price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Subtotal</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">
                {roundCents(person.subtotal)}
              </TableCell>
            </TableRow>
            {person.tax === 0 || (
              <TableRow>
                <TableCell>Tax</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  {roundCents(person.tax)}
                </TableCell>
              </TableRow>
            )}
            {person.tip === 0 || (
              <TableRow>
                <TableCell>Tip</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  {roundCents(person.tip)}
                </TableCell>
              </TableRow>
            )}
            {person.discount === 0 || (
              <TableRow>
                <TableCell>Discount</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  -{roundCents(person.discount)}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell>TOTAL</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">
                {roundCents(person.total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </DialogContent>
    </Dialog>
  );

  const FullReceiptModal = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{formData.stepItems.businessName}</DialogTitle>
          <DialogDescription>Final Tab</DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.stepItems.Items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.item}</TableCell>
                <TableCell className="text-right">
                  {roundCents(item.price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Subtotal</TableCell>
              <TableCell className="text-right">
                {roundCents(calculateTotals.subtotal)}
              </TableCell>
            </TableRow>
            {formData.stepItems.tax === 0 || (
              <TableRow>
                <TableCell>Tax</TableCell>
                <TableCell className="text-right">
                  {roundCents(formData.stepItems.tax)}
                </TableCell>
              </TableRow>
            )}
            {formData.stepItems.tip === 0 || (
              <TableRow>
                <TableCell>Tip</TableCell>
                <TableCell className="text-right">
                  {roundCents(formData.stepItems.tip)}
                </TableCell>
              </TableRow>
            )}
            {formData.stepItems.discount === 0 || (
              <TableRow>
                <TableCell>Discount</TableCell>
                <TableCell className="text-right">
                  -{roundCents(formData.stepItems.discount)}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right">
                {roundCents(calculateTotals.total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </DialogContent>
    </Dialog>
  );

  const handleShare = async (): Promise<void> => {
    setIsOpen(true);

    // Early return if we already have a share URL
    if (shareUrl) {
      console.log("shareUrl exists");
      return;
    }

    // Early return if we have a billId
    if (billId) {
      const shareableUrl = `${window.location.origin}/bills/${billId}`;
      setShareUrl(shareableUrl);
      return;
    }

    try {
      setIsSaving(true);

      // Create a deep copy of formData for modification
      let modifiedFormData = {
        ...formData,
        stepReceiptUpload: {
          ...formData.stepReceiptUpload,
        },
      };

      // Check if we need to upload the image to Supabase
      const receiptImageURL = formData.stepReceiptUpload?.receiptImageURL;
      const receiptImage = formData.stepReceiptUpload?.image;

      if (
        receiptImageURL?.startsWith("blob:") &&
        receiptImage instanceof File
      ) {
        console.log("Uploading blob image to Supabase...");

        try {
          // Upload the image to Supabase
          const permanentUrl = await uploadReceiptImage(receiptImage);

          // Update the form data with the permanent URL
          modifiedFormData.stepReceiptUpload.receiptImageURL = permanentUrl;
          // Remove the File object as it can't be serialized
          delete modifiedFormData.stepReceiptUpload.image;
        } catch (uploadError) {
          console.error("Error uploading image to Supabase:", uploadError);
          toast.error("Failed to upload receipt image");
        }
      }

      // Prepare the data to save with potentially updated image URL
      const billData = {
        form_data: modifiedFormData,
        allocation,
      };

      console.log("Sending bill data to API:", billData);

      // Send data to API route
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save bill data");
      }

      const shareableUrl = data.shareUrl;
      setShareUrl(shareableUrl);
    } catch (error) {
      console.error("Error saving bill data:", error);
      toast.error("Failed to generate share link");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-4 md:flex md:justify-between md:items-center md:space-y-0">
          <div>
            <CardTitle className="text-lg font-medium">
              {formData.stepItems.businessName}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {formattedDate}
            </CardDescription>
          </div>
          <div className="flex space-x-4">
            <ViewReceipt
              receiptImageURL={formData.stepReceiptUpload.receiptImageURL}
            />
            <ShareModal
              url={shareUrl || fullUrl}
              onShare={handleShare}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
            />
          </div>
        </div>
        <Separator />
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : allocation ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocation.people.map((person, index) => (
                  <TableRow key={index}>
                    <TableCell>{person.name}</TableCell>
                    <TableCell className="text-right">
                      {roundCents(person.total)}
                    </TableCell>
                    <TableCell>
                      <ItemizedBreakdownModal person={person} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">
                    {roundCents(calculateTotals.total)}
                  </TableCell>
                  <TableCell>
                    <FullReceiptModal />
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>
        ) : (
          <p>Error calculating bill split. Please try again.</p>
        )}
      </CardContent>
    </Card>
  );
}
