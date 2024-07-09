import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormData } from "@/lib/formSchema";

export default function Summary({ formData }: { formData: FormData }) {
  return (
    <Card>
      <CardContent>
        <h1 className="text-2xl font-bold pt-6">{formData.stepOne.mealName}</h1>
        {formData.stepTwo.receiptImage && (
          <div>
            <h2 className="text-xl font-semibold">Receipt Image</h2>
            <Image
              src={formData.stepTwo.receiptImage}
              alt="Receipt"
              width={300}
              height={300}
              objectFit="contain"
            />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">Food Items</h2>
          <ul>
            {formData.stepThree.foodItems.map((item, index) => (
              <li key={index}>
                {item.item}: ${item.price}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Additional Costs</h2>
          <p>Tax: ${formData.stepThree.tax}</p>
          <p>Tip: ${formData.stepThree.tip}</p>
          <p>Discount: ${formData.stepThree.discount}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Participants</h2>
          <ul>
            {formData.stepFour.map((person, index) => (
              <li key={index}>{person.name}</li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-4">
        <Button variant="outline">Edit in Google Sheets</Button>
        <Button>Allocate Tab</Button>
      </CardFooter>
    </Card>
  );
}
