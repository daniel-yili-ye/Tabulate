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
import { splitBill, BillAllocation } from "@/utils/billSplitter";
import { Loader2 } from "lucide-react";
import { Share2Icon } from "@radix-ui/react-icons";

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
        // Handle error (e.g., show error message to user)
      } finally {
        setIsLoading(false);
      }
    };

    calculateAllocation();
  }, [formData]);

  const totalBill = allocation
    ? allocation.people.reduce((sum, person) => sum + person.subtotal, 0)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{formData.stepOne.mealName}</CardTitle>
          <Button>
            Share&nbsp;
            <Share2Icon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {formData.stepTwo.receiptImage && (
          <Image
            src={formData.stepTwo.receiptImage}
            alt="Receipt"
            width={300}
            height={300}
            objectFit="contain"
          />
        )}

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocation.people.map((person, index) => (
                  <TableRow key={index}>
                    <TableCell>{person.name}</TableCell>
                    <TableCell className="text-right">
                      ${(person.subtotal / 100).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">
                    ${(totalBill / 100).toFixed(2)}
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
