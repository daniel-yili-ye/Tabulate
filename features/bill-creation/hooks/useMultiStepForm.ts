import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import {
  formSchema,
  FormData,
} from "@/features/bill-creation/schemas/formSchema";

const defaultValues: FormData = {
  stepReceiptUpload: { receiptImageURL: undefined, image: undefined },
  stepItems: {
    businessName: "",
    date: new Date(),
    Items: [{ item: "", price: 0 }],
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
  stepAllocateItems: [],
};

export const useMultiStepForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReceiptProcessing, setIsReceiptProcessing] = useState(false);

  const form = useForm<FormData>({
    shouldUnregister: false,
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(formSchema),
  });

  const stepFieldNames = [
    "stepReceiptUpload",
    "stepItems", 
    "stepParticipants",
    "stepAllocateItems",
  ] as const;

  const totalSteps = stepFieldNames.length;

  const handleNext = async () => {
    const currentStepField = stepFieldNames[currentStep];
    const isValid = await form.trigger(currentStepField);
    
    console.log(currentStepField, isValid, currentStep);
    
    if (isValid) {
      if (currentStep === totalSteps - 1) {
        // Submit form
        const formData = form.getValues();
        console.log(formData);
        setIsSubmitted(true);
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleReceiptProcessingStateChange = (isProcessing: boolean) => {
    setIsReceiptProcessing(isProcessing);
  };

  const reset = () => {
    setCurrentStep(0);
    setIsSubmitted(false);
    setIsReceiptProcessing(false);
    form.reset(defaultValues);
  };

  return {
    // Form state
    form,
    currentStep,
    isSubmitted,
    isReceiptProcessing,
    
    // Form data
    formData: form.getValues(),
    
    // Actions
    handleNext,
    handlePrevious,
    handleReceiptProcessingStateChange,
    reset,
    
    // Computed properties
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1,
    canGoBack: currentStep > 0,
    canGoNext: currentStep < totalSteps - 1,
  };
}; 