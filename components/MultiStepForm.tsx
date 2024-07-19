"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Form } from "./ui/form";
import Step1MealName from "./Step1MealName";
import Step2ReceiptUpload from "./Step2ReceiptUpload";
import Step3FoodItems from "./Step3FoodItems";
import Step4Participants from "./Step4Participants";
import Step5AllocateFoodItems from "./Step5AllocateFoodItems";
import Summary from "./Summary";
import { formSchema, FormData } from "../lib/formSchema";
import { splitBill } from "@/utils/billSplitter";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

const steps = [
  "Meal Name",
  "Receipt Upload",
  "Food Items",
  "Participants",
  "Allocate Food Items",
];

const defaultValues: FormData = {
  stepOne: { mealName: "" },
  stepTwo: { receiptImage: null },
  stepThree: {
    foodItems: [{ item: "", price: 0 }],
    tax: 0,
    tip: 0,
    discount: 0,
  },
  stepFour: [{ name: "" }, { name: "" }],
  stepFive: [],
};

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormData>({
    shouldUnregister: false,
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(formSchema),
  });

  const { handleSubmit } = form;

  const onSubmit = (data: FormData) => {
    console.log(data);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return <Summary formData={form.getValues()} />;
  }

  const handleNext = async () => {
    const stepNumber: (
      | "stepOne"
      | "stepTwo"
      | "stepThree"
      | "stepFour"
      | "stepFive"
    )[] = ["stepOne", "stepTwo", "stepThree", "stepFour", "stepFive"];

    const isValid = await form.trigger(stepNumber[currentStep]);
    if (isValid) {
      if (currentStep === steps.length - 1) {
        handleSubmit(onSubmit)();
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1MealName />;
      case 1:
        return <Step2ReceiptUpload />;
      case 2:
        return <Step3FoodItems />;
      case 3:
        return <Step4Participants />;
      case 4:
        return <Step5AllocateFoodItems />;
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
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
              <ChevronLeftIcon /> Previous
            </Button>
            <Button type="button" onClick={handleNext} className="space-x-4">
              {currentStep === steps.length - 1 ? (
                "Submit"
              ) : (
                <>
                  Next <ChevronRightIcon />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
