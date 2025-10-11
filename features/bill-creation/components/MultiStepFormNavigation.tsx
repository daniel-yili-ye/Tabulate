import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";

interface MultiStepFormNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoBack: boolean;
  isReceiptProcessing: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function MultiStepFormNavigation({
  isFirstStep,
  isLastStep,
  canGoBack,
  isReceiptProcessing,
  onPrevious,
  onNext,
}: MultiStepFormNavigationProps) {
  const renderPreviousButton = () => {
    if (isFirstStep) {
      return <div />; // Empty div for spacing
    }

    return (
      <Button
        type="button"
        onClick={onPrevious}
        variant="outline"
        disabled={!canGoBack}
      >
        <ChevronLeftIcon /> Previous
      </Button>
    );
  };

  const renderNextButton = () => {
    if (isLastStep) {
      return (
        <Button key="submit" type="button" onClick={onNext}>
          Submit
        </Button>
      );
    }

    if (isFirstStep && isReceiptProcessing) {
      return (
        <Button
          key="processing"
          type="button"
          onClick={onNext}
          variant="ghost"
          disabled
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </Button>
      );
    }

    if (isFirstStep) {
      return (
        <Button key="skip" type="button" variant="ghost" onClick={onNext}>
          Skip <ChevronRightIcon />
        </Button>
      );
    }

    return (
      <Button key="next" type="button" onClick={onNext}>
        Next <ChevronRightIcon />
      </Button>
    );
  };

  return (
    <div className="flex justify-between w-full">
      {renderPreviousButton()}
      {renderNextButton()}
    </div>
  );
}
