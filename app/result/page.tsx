// app/result/page.tsx
"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function ResultPage() {
  const searchParams = useSearchParams();
  const formData = JSON.parse(searchParams.get("formData") || "{}");

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-bold pt-6">{formData.mealName}</h1>
          {formData.receiptImage && (
            <div>
              <h2 className="text-xl font-semibold">Receipt Image</h2>
              <Image
                src={formData.receiptImage}
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
              {formData.foodItems.map((item, index) => (
                <li key={index}>
                  {item.item}: ${item.price}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Additional Costs</h2>
            <p>Tax: ${formData.tax}</p>
            <p>Tip: ${formData.tip}</p>
            <p>Discount: ${formData.discount}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Participants</h2>
            <ul>
              {formData.participants.map((participant, index) => (
                <li key={index}>{participant}</li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline">Edit in Google Sheets</Button>
          <Button>Allocate Tab</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
