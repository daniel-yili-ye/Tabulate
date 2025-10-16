import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { FormData } from "@/lib/validation/formSchema";
import { roundCents } from "../utils/formatters";

interface FullReceiptModalProps {
  formData: FormData;
  subtotal: number;
  total: number;
}

export default function FullReceiptModal({
  formData,
  subtotal,
  total,
}: FullReceiptModalProps) {
  return (
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
                  ${roundCents(item.price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Subtotal</TableCell>
              <TableCell className="text-right">
                ${roundCents(subtotal)}
              </TableCell>
            </TableRow>
            {formData.stepItems.tax !== 0 && (
              <TableRow>
                <TableCell>Tax</TableCell>
                <TableCell className="text-right">
                  ${roundCents(formData.stepItems.tax)}
                </TableCell>
              </TableRow>
            )}
            {formData.stepItems.tip !== 0 && (
              <TableRow>
                <TableCell>Tip</TableCell>
                <TableCell className="text-right">
                  ${roundCents(formData.stepItems.tip)}
                </TableCell>
              </TableRow>
            )}
            {formData.stepItems.discount !== 0 && (
              <TableRow className="text-green-600 dark:text-green-500">
                <TableCell>Discount</TableCell>
                <TableCell className="text-right">
                  -${roundCents(formData.stepItems.discount)}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right">${roundCents(total)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
