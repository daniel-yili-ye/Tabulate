"use client";

import { FormProvider } from "react-hook-form";
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
    <FormProvider {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-6">
          <MultiStepFormHeader
            title={currentStepConfig.title}
            description={currentStepConfig.description}
            sideContent={currentStepConfig.sideContent?.(receiptImageURL)}
          />

          <div>{currentStepConfig.component}</div>

          <div>
            <MultiStepFormNavigation
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              canGoBack={canGoBack}
              isReceiptProcessing={isReceiptProcessing}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
