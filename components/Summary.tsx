import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormData } from "@/lib/formSchema";

export default function Summary({ formData }: { formData: FormData }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{formData.stepOne.mealName}</CardTitle>
          {/* <Button variant="outline">Edit in Google Sheets</Button> */}
          <Button>Share</Button>
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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Item</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.stepThree.foodItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.item}</TableCell>
                  <TableCell className="text-right">${item.price}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">Tax</TableCell>
                <TableCell className="text-right">
                  ${formData.stepThree.tax}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tip</TableCell>
                <TableCell className="text-right">
                  ${formData.stepThree.tip}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Discount</TableCell>
                <TableCell className="text-right">
                  $({formData.stepThree.discount})
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Participants</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.stepFour.map((person, index) => (
                <TableRow key={index}>
                  <TableCell>{person.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </CardContent>
    </Card>
  );
}
