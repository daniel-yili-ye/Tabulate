"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import StepReceiptUpload from "./StepReceiptUpload";
import StepFoodItems from "./StepFoodItems";
import StepParticipants from "./StepParticipants";
import StepAllocateFoodItems from "./StepAllocateFoodItems";
import Summary from "./Summary";
import { formSchema, FormData } from "../../schema/formSchema";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { v4 as uuidv4 } from "uuid";
import ViewReceipt from "./ViewReceipt";
import { Separator } from "../ui/separator";

const steps = [
  "Upload Receipt",
  "Receipt Details",
  "Participants",
  "Allocate Receipt Items",
];

const defaultValues: FormData = {
  stepReceiptUpload: { receiptImageURL: undefined, image: undefined },
  stepFoodItems: {
    restaurantName: "",
    date: new Date(),
    foodItems: [{ item: "", price: 0 }],
    tax: 0,
    tip: 0,
    discount: 0,
    subtotal: 0,
    total: 0,
  },
  stepParticipants: [
    {
      name: "",
      id: uuidv4(),
    },
    {
      name: "",
      id: uuidv4(),
    },
  ],
  stepAllocateFoodItems: [],
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
      | "stepReceiptUpload"
      | "stepFoodItems"
      | "stepParticipants"
      | "stepAllocateFoodItems"
    )[] = [
      "stepReceiptUpload",
      "stepFoodItems",
      "stepParticipants",
      "stepAllocateFoodItems",
    ];

    const isValid = await form.trigger(stepNumber[currentStep]);
    console.log(stepNumber[currentStep], isValid);
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
        return <StepReceiptUpload />;
      case 1:
        return <StepFoodItems />;
      case 2:
        return <StepParticipants />;
      case 3:
        return <StepAllocateFoodItems />;
      default:
        return null;
    }
  };

  const renderDescription = () => {
    switch (currentStep) {
      case 0:
        return "Upload an image of the receipt. Tabulate will try to automatically input your receipt details for you!";
      case 1:
        return "Review and edit the receipt details.";
      case 2:
        return "Enter the participant names.";
      case 3:
        return "Allocate items to participants. Items can be allocated to multiple people.";
      default:
        return null;
    }
  };

  const { watch } = form;
  const receiptImageURL = watch("stepReceiptUpload.receiptImageURL");

  const renderReceiptImageURL = () => {
    switch (currentStep) {
      case 1:
        return <ViewReceipt receiptImageURL={receiptImageURL} />;
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
                <CardTitle className="text-xl font-medium">
                  {steps[currentStep]}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {renderDescription()}
                </CardDescription>
              </div>
              {renderReceiptImageURL()}
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
