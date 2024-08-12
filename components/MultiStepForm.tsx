"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
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
import { v4 as uuidv4 } from "uuid";
import ViewReceipt from "./ViewReceipt";
import { Separator } from "./ui/separator";

const steps = [
  "Receipt Name",
  "Upload Receipt",
  "Receipt Details",
  "Participants",
  "Allocate Receipt Items",
];

const defaultValues: FormData = {
  stepOne: { mealName: "" },
  stepTwo: { receiptImage: null },
  stepThree: {
    foodItems: [{ item: "", price: 0 }],
    tax: 0,
    tip: 0,
    discount: 0,
    subtotal: 0,
    total: 0,
  },
  stepFour: [
    {
      name: "",
      id: uuidv4(),
    },
    {
      name: "",
      id: uuidv4(),
    },
  ],
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

  const renderDescription = () => {
    switch (currentStep) {
      case 0:
        return "Enter the receipt name (ex. Maha's Brunch).";
      case 1:
        return "Upload an image of the receipt. Tabulate will try to automatically input your receipt details for you!";
      case 2:
        return "Review and edit the receipt details.";
      case 3:
        return "Enter the participant names.";
      case 4:
        return "Allocate items to participants. Items can be allocated to multiple people.";
      default:
        return null;
    }
  };

  const { watch } = form;
  const receiptImage = watch("stepTwo.receiptImage");

  const renderReceiptImage = () => {
    switch (currentStep) {
      case 2:
        return <ViewReceipt receiptImage={receiptImage} />;
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardHeader className="space-y-4">
            <div className="space-y-4 md:flex md:justify-between md:items-center md:space-y-0">
              <div>
                <CardTitle className="text-lg font-medium">
                  {steps[currentStep]}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {renderDescription()}
                </CardDescription>
              </div>
              {renderReceiptImage()}
            </div>
            <Separator />
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
          <CardFooter className="flex justify-between">
            {currentStep === 0 ? (
              <div></div>
            ) : (
              <Button type="button" onClick={handlePrev}>
                <ChevronLeftIcon /> Previous
              </Button>
            )}
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
