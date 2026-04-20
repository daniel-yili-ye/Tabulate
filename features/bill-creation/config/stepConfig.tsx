import { ReactNode } from "react";
import StepReceiptUpload from "../components/steps/Step1ReceiptUpload";
import StepItems from "../components/steps/Step2Items";
import StepParticipants from "../components/steps/Step3Participants";
import StepAllocateItems from "../components/steps/Step4AllocateItems";
import ViewReceipt from "../components/ViewReceipt";

export interface StepConfig {
  id: string;
  title: string;
  description: string;
  component: ReactNode;
  sideContent?: (receiptImageURL?: string) => ReactNode;
}

export const createStepConfig = (
  onProcessingSuccess: () => void,
  onProcessingStateChange: (isProcessing: boolean) => void
): StepConfig[] => [
  {
    id: "upload",
    title: "Upload Receipt",
    description:
      "Upload an image of the receipt. Tabulate will try to automatically input your receipt details for you!",
    component: (
      <StepReceiptUpload
        onProcessingSuccess={onProcessingSuccess}
        onProcessingStateChange={onProcessingStateChange}
      />
    ),
  },
  {
    id: "items",
    title: "Receipt Details",
    description: "Review and edit the receipt details.",
    component: <StepItems />,
    sideContent: (receiptImageURL?: string) => (
      <ViewReceipt receiptImageURL={receiptImageURL} />
    ),
  },
  {
    id: "participants",
    title: "Participants",
    description: "Enter the participant names.",
    component: <StepParticipants />,
    sideContent: (receiptImageURL?: string) => (
      <ViewReceipt receiptImageURL={receiptImageURL} />
    ),
  },
  {
    id: "allocate",
    title: "Allocate Receipt Items",
    description:
      "Select who's responsible for each item and how to split the cost.",
    component: <StepAllocateItems />,
    sideContent: (receiptImageURL?: string) => (
      <ViewReceipt receiptImageURL={receiptImageURL} />
    ),
  },
];
