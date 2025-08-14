import { ReactNode } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <CardHeader className="space-y-4">
      <div className="space-y-4 md:flex md:justify-between md:items-center md:space-y-0">
        <div>
          <CardTitle className="text-xl font-medium">{title}</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {description}
          </CardDescription>
        </div>
        {sideContent}
      </div>
      <Separator />
    </CardHeader>
  );
}
