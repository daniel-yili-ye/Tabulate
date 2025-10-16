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
import { PersonAllocation } from "@/lib/validation/allocationSchema";
import { roundCents } from "../utils/formatters";

interface ItemizedBreakdownModalProps {
  person: PersonAllocation;
}

export default function ItemizedBreakdownModal({
  person,
}: ItemizedBreakdownModalProps) {
  return (
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
                  ${roundCents(item.fullPrice)} / {item.participants}
                </TableCell>
                <TableCell className="text-right">
                  ${roundCents(item.price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Subtotal</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">
                ${roundCents(person.subtotal)}
              </TableCell>
            </TableRow>
            {person.tax !== 0 && (
              <TableRow>
                <TableCell>Tax</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  ${roundCents(person.tax)}
                </TableCell>
              </TableRow>
            )}
            {person.tip !== 0 && (
              <TableRow>
                <TableCell>Tip</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  ${roundCents(person.tip)}
                </TableCell>
              </TableRow>
            )}
            {person.discount !== 0 && (
              <TableRow className="text-green-600 dark:text-green-500">
                <TableCell>Discount</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  -${roundCents(person.discount)}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell>TOTAL</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">
                ${roundCents(person.total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
