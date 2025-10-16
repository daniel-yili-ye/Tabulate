import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

interface MultiStepFormHeaderProps {
  title: string;
  description: string;
  sideContent?: ReactNode;
}

export function MultiStepFormHeader({
  title,
  description,
  sideContent,
}: MultiStepFormHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-4 md:flex md:justify-between md:items-center md:space-y-0">
        <div>
          <h2 className="text-xl font-medium">{title}</h2>
          <p className="text-base text-muted-foreground">{description}</p>
        </div>
        {sideContent}
      </div>
      <Separator />
    </div>
  );
}
