"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useMultiStepForm } from "../hooks/useMultiStepForm";
import { createStepConfig } from "../config/stepConfig";
import { MultiStepFormHeader } from "./MultiStepFormHeader";
import { MultiStepFormNavigation } from "./MultiStepFormNavigation";
import Summary from "@/features/bill-splitting/components/Summary";

export default function MultiStepForm() {
  const {
    form,
    currentStep,
    isSubmitted,
    isReceiptProcessing,
    formData,
    handleNext,
    handlePrevious,
    handleReceiptProcessingStateChange,
    isFirstStep,
    isLastStep,
    canGoBack,
  } = useMultiStepForm();

  // Create step configuration
  const stepConfig = createStepConfig(
    handleNext,
    handleReceiptProcessingStateChange
  );

  // Handle form submission result
  if (isSubmitted) {
    return <Summary formData={formData} />;
  }

  const currentStepConfig = stepConfig[currentStep];
  const receiptImageURL = form.watch("stepReceiptUpload.receiptImageURL");

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Card>
          <MultiStepFormHeader
            title={currentStepConfig.title}
            description={currentStepConfig.description}
            sideContent={currentStepConfig.sideContent?.(receiptImageURL)}
          />

          <CardContent>{currentStepConfig.component}</CardContent>

          <CardFooter>
            <MultiStepFormNavigation
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              canGoBack={canGoBack}
              isReceiptProcessing={isReceiptProcessing}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
