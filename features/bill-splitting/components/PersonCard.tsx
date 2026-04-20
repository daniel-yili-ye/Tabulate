"use client";

import { User } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { PersonAllocation } from "@/lib/validation/allocationSchema";
import { roundCents } from "../utils/formatters";

interface PersonCardProps {
  person: PersonAllocation;
  defaultOpen?: boolean;
}

export default function PersonCard({ person, defaultOpen = false }: PersonCardProps) {
  const formatCurrency = (amount: number) => roundCents(amount);

  return (
    <Card className="overflow-hidden">
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? `person-${person.id}` : undefined}
      >
        <AccordionItem value={`person-${person.id}`} className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              {/* Avatar */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>

              {/* Name and item count */}
              <div className="flex flex-col items-start">
                <span className="font-semibold text-foreground">
                  {person.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {person.items.length} item{person.items.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Total amount */}
              <div className="ml-auto flex flex-col items-end pr-2">
                <span className="text-xl font-bold text-foreground">
                  ${formatCurrency(person.total)}
                </span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4">
            <Separator className="mb-4" />

            {/* Item Breakdown */}
            <div className="space-y-3 mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <span className="text-muted-foreground">💰</span>
                Item Breakdown
              </h4>

              <div className="space-y-2">
                {person.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between py-2 px-3 bg-muted/30 rounded-md"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{item.item}</span>
                      <span className="text-xs text-muted-foreground">
                        Item price: ${formatCurrency(item.fullPrice || item.price)}
                      </span>
                      {item.participants > 1 && (
                        <span className="text-xs text-muted-foreground">
                          Split {item.participants} ways
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-sm">
                      ${formatCurrency(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-foreground">
                Financial Breakdown
              </h4>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items Subtotal:</span>
                  <span className="text-foreground font-medium">
                    ${formatCurrency(person.subtotal)}
                  </span>
                </div>

                {person.discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-500">
                    <span>Discount Applied:</span>
                    <span className="font-medium">
                      -${formatCurrency(person.discount)}
                    </span>
                  </div>
                )}

                {person.tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax Share:</span>
                    <span className="text-foreground font-medium">
                      ${formatCurrency(person.tax)}
                    </span>
                  </div>
                )}

                {person.tip > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tip Share:</span>
                    <span className="text-foreground font-medium">
                      ${formatCurrency(person.tip)}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between font-semibold text-base">
                  <span>Total Amount:</span>
                  <span>${formatCurrency(person.total)}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

