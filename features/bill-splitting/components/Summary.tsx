import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { FormData } from "@/features/bill-creation/schemas/formSchema";
import { splitBill } from "@/features/bill-splitting/utils/billSplitter";
import {
  BillAllocation,
  PersonAllocation,
} from "@/features/bill-splitting/schemas/allocationSchema";
import { Loader2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import ViewReceipt from "@/features/bill-creation/components/ViewReceipt";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import ShareModal from "@/features/bill-sharing/components/ShareModal";
import { uploadReceiptImage } from "@/services/storage/supabase";

// Define expected success response from /api/tab POST
interface SaveBillSuccessResponse {
  success: boolean;
  billId: string;
  shareUrl: string;
}

// Define potential error response
interface SaveBillErrorResponse {
  success: boolean;
  error: string;
  details?: any;
}

// Define the input type for the mutation
interface SaveBillInput {
  formData: FormData;
  allocation: BillAllocation | null;
}

// Define the mutation function
async function saveBill(
  input: SaveBillInput
): Promise<SaveBillSuccessResponse> {
  const { formData, allocation } = input;

  // Create a deep copy of formData for modification
  let modifiedFormData = JSON.parse(JSON.stringify(formData)); // Simple deep copy for this structure

  // Check if we need to upload the image to Supabase
  const receiptImageURL = formData.stepReceiptUpload?.receiptImageURL;
  const receiptImage = formData.stepReceiptUpload?.image;

  // Check specifically for blob URLs and ensure image is a File
  if (
    typeof receiptImageURL === "string" &&
    receiptImageURL.startsWith("blob:") &&
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
      toast.error("Failed to upload receipt image. Bill not saved.");
      // Re-throw or throw a specific error to stop the save process
      throw new Error("Image upload failed");
    }
  } else {
    // If not uploading a blob, still remove potential File object before sending to API
    if (modifiedFormData.stepReceiptUpload?.image) {
      delete modifiedFormData.stepReceiptUpload.image;
    }
  }

  // Prepare the data to save
  const billData = {
    form_data: modifiedFormData,
    allocation,
  };

  console.log("Sending bill data to API:", billData);

  // Send data to API route
  const response = await fetch("/api/tab", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(billData),
  });

  const data: SaveBillSuccessResponse | SaveBillErrorResponse =
    await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      (data as SaveBillErrorResponse).error || "Failed to save bill data"
    );
  }

  return data as SaveBillSuccessResponse;
}

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
    const calculateAllocation = () => {
      try {
        const result = splitBill(formData);
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

  const mutation = useMutation<SaveBillSuccessResponse, Error, SaveBillInput>({
    mutationFn: saveBill,
    onMutate: () => {
      // Called before saveBill runs
      // Can optionally return context to onSuccess/onError
    },
    onSuccess: (data) => {
      // data is the result from saveBill (SaveBillSuccessResponse)
      setShareUrl(data.shareUrl);
      // Optionally, trigger refetch of queries if needed, e.g., queryClient.invalidateQueries(['bills'])
      // Toast notification can be moved here if preferred
    },
    onError: (error) => {
      // error is the Error thrown from saveBill
      console.error("Error saving bill data:", error);
      toast.error(error.message || "Failed to generate share link");
    },
    onSettled: () => {
      // Called after success or error
      // This replaces the finally block logic for isSaving
    },
  });

  const handleShare = async (): Promise<void> => {
    setIsOpen(true);

    // Early return if we already have a share URL from a previous successful mutation or from props
    if (shareUrl || mutation.data?.shareUrl) {
      setShareUrl(shareUrl || mutation.data!.shareUrl); // Ensure state is set if using mutation data
      console.log("Share URL already exists or generated.");
      return;
    }

    // Early return if we have a billId from props (viewing an existing bill)
    if (billId) {
      const existingShareUrl = `${window.location.origin}/tab/${billId}`;
      setShareUrl(existingShareUrl);
      console.log("Using existing billId for share URL.");
      return;
    }

    // Trigger the mutation if we don't have a URL and are not viewing an existing bill
    if (!allocation) {
      console.error("Allocation not calculated yet, cannot save.");
      toast.error("Cannot generate link until allocation is calculated.");
      setIsOpen(false); // Close modal if we can't proceed
      return;
    }

    mutation.mutate({ formData, allocation });
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
              url={shareUrl || mutation.data?.shareUrl || fullUrl}
              onShare={handleShare}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isSaving={mutation.isPending}
              setIsSaving={() => {}}
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
