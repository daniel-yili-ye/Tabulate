import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { FormData } from "@/lib/formSchema";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageIcon, Share2Icon } from "@radix-ui/react-icons";

export default function Summary({ formData }: { formData: FormData }) {
  const [allocation, setAllocation] = useState<BillAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateAllocation = async () => {
      try {
        const result = await splitBill(formData);
        setAllocation(result);
      } catch (error) {
        console.error("Error calculating bill split:", error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateAllocation();
  }, [formData]);

  const totalBill = allocation
    ? allocation.people.reduce((sum, person) => sum + person.subtotal, 0)
    : 0;

  const ReceiptModal = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!formData.stepTwo.receiptImage}>
          <ImageIcon />
          &nbsp;View Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        {formData.stepTwo.receiptImage && (
          <Image
            src={formData.stepTwo.receiptImage}
            alt="Receipt"
            width={400}
            height={600}
            objectFit="contain"
          />
        )}
      </DialogContent>
    </Dialog>
  );

  const ItemizedBreakdownModal = ({ person }: { person: PersonAllocation }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{person.name} Breakdown</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {person.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.item}</TableCell>
                <TableCell className="text-right">
                  ${(item.price / 100).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Subtotal</TableCell>
              <TableCell className="text-right">
                $
                {person.items
                  .reduce((sum, item) => sum + item.price / 100, 0)
                  .toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tax</TableCell>
              <TableCell className="text-right">
                ${(person.tax / 100).toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tip</TableCell>
              <TableCell className="text-right">
                ${(person.tip / 100).toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Discount</TableCell>
              <TableCell className="text-right">
                -${(person.discount / 100).toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right">
                ${(person.subtotal / 100).toFixed(2)}
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Full Receipt</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.stepThree.foodItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.item}</TableCell>
                <TableCell className="text-right">
                  ${(Math.round(item.price * 100) / 100).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Subtotal</TableCell>
              <TableCell className="text-right">
                $
                {formData.stepThree.foodItems
                  .reduce(
                    (sum, item) => sum + Math.round(item.price * 100) / 100,
                    0
                  )
                  .toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tax</TableCell>
              <TableCell className="text-right">
                ${(Math.round(formData.stepThree.tax * 100) / 100).toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tip</TableCell>
              <TableCell className="text-right">
                ${(Math.round(formData.stepThree.tip * 100) / 100).toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Discount</TableCell>
              <TableCell className="text-right">
                -$
                {(Math.round(formData.stepThree.discount * 100) / 100).toFixed(
                  2
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right">
                ${(totalBill / 100).toFixed(2)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{formData.stepOne.mealName}</CardTitle>
          <div className="flex space-x-2">
            <ReceiptModal />
            <Button>
              Share&nbsp;
              <Share2Icon />
            </Button>
          </div>
        </div>
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
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocation.people.map((person, index) => (
                  <TableRow key={index}>
                    <TableCell>{person.name}</TableCell>
                    <TableCell className="text-right">
                      ${(person.subtotal / 100).toFixed(2)}
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
                    ${(totalBill / 100).toFixed(2)}
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
