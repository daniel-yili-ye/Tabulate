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
      <Button type="button" onClick={onPrevious} disabled={!canGoBack}>
        <ChevronLeftIcon /> Previous
      </Button>
    );
  };

  const renderNextButton = () => {
    if (isLastStep) {
      return (
        <Button type="button" onClick={onNext}>
          Submit
        </Button>
      );
    }

    if (isFirstStep && isReceiptProcessing) {
      return (
        <Button type="button" onClick={onNext} disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </Button>
      );
    }

    return (
      <Button type="button" onClick={onNext}>
        {isFirstStep ? (
          <>
            Skip <ChevronRightIcon />
          </>
        ) : (
          <>
            Next <ChevronRightIcon />
          </>
        )}
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
