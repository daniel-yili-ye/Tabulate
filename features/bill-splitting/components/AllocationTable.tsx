import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { BillAllocation } from "@/lib/validation/allocationSchema";
import { roundCents } from "../utils/formatters";
import ItemizedBreakdownModal from "./ItemizedBreakdownModal";
import FullReceiptModal from "./FullReceiptModal";
import { FormData } from "@/lib/validation/formSchema";

interface AllocationTableProps {
  allocation: BillAllocation;
  formData: FormData;
  total: number;
}

export default function AllocationTable({
  allocation,
  formData,
  total,
}: AllocationTableProps) {
  const subtotal = formData.stepItems.Items.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0
  );

  return (
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
                ${roundCents(person.total)}
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
            <TableCell className="text-right">${roundCents(total)}</TableCell>
            <TableCell>
              <FullReceiptModal
                formData={formData}
                subtotal={subtotal}
                total={total}
              />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}
