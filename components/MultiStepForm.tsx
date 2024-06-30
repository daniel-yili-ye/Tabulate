"use client";

// components/MultiStepForm.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Form } from "./ui/form";
import Step1MealName from "./Step1MealName";
import Step2ReceiptUpload from "./Step2ReceiptUpload";
import Step3FoodItems from "./Step3FoodItems";
import Step4Participants from "./Step4Participants";
import { formSchema, FormData } from "../lib/formSchema";

const steps = ["Meal Name", "Receipt Upload", "Food Items", "Participants"];

export default function MultiStepForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      mealName: "",
      receiptImage: null,
      foodItems: [{ item: "", price: undefined }],
      tax: undefined,
      tip: undefined,
      discount: undefined,
      participants: ["", ""],
    },
  });

  const handleNext = async () => {
    const isValid = await form.trigger();
    // console.log(isValid);
    // if (isValid) {
    if (currentStep === steps.length - 1) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
    // }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = form.handleSubmit((data) => {
    const formDataString = encodeURIComponent(JSON.stringify(data));
    router.push(`/result?formData=${formDataString}`);
  });

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1MealName form={form} />;
      case 1:
        return <Step2ReceiptUpload form={form} />;
      case 2:
        return <Step3FoodItems form={form} />;
      case 3:
        return <Step4Participants form={form} />;
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent>
            <div className="mb-4">
              <h2 className="text-xl font-semibold pt-6">
                {steps[currentStep]}
              </h2>
            </div>
            {renderStep()}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button type="button" onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Submit" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
