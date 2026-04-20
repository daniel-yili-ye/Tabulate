"use client";

import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { roundCents } from "../utils/formatters";

interface ReceiptItem {
  item?: string;
  price?: number;
}

interface ReceiptCardProps {
  businessName?: string;
  date?: Date | string;
  items: ReceiptItem[];
  subtotal: number;
  tax?: number;
  tip?: number;
  discount?: number;
  total: number;
  defaultOpen?: boolean;
}

export default function ReceiptCard({
  businessName,
  date,
  items,
  subtotal,
  tax = 0,
  tip = 0,
  discount = 0,
  total,
  defaultOpen = false,
}: ReceiptCardProps) {
  const formatCurrency = (amount: number) => roundCents(amount);

  const formatDate = (d: Date | string | undefined) => {
    if (!d) return "";
    const dateObj = typeof d === "string" ? new Date(d) : d;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="overflow-hidden">
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? "receipt" : undefined}
      >
        <AccordionItem value="receipt" className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground">
                <Receipt className="h-5 w-5" />
              </div>

              {/* Receipt info */}
              <div className="flex flex-col items-start">
                <span className="font-semibold text-foreground">
                  Full Receipt
                </span>
                <span className="text-sm text-muted-foreground">
                  {businessName || "Receipt Details"}
                  {date && ` · ${formatDate(date)}`}
                </span>
              </div>

              {/* Total */}
              <div className="ml-auto flex flex-col items-end pr-2">
                <span className="text-xl font-bold text-foreground">
                  ${formatCurrency(total)}
                </span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4">
            <Separator className="mb-4" />

            {/* Items List */}
            <div className="space-y-3 mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <span className="text-muted-foreground">🧾</span>
                Items
              </h4>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md"
                  >
                    <span className="text-sm">{item.item || `Item ${index + 1}`}</span>
                    <span className="font-medium text-sm">
                      ${formatCurrency(Number(item.price) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span className="text-foreground font-medium">
                    ${formatCurrency(subtotal)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-500">
                    <span>Discount:</span>
                    <span className="font-medium">
                      -${formatCurrency(discount)}
                    </span>
                  </div>
                )}

                {tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax:</span>
                    <span className="text-foreground font-medium">
                      ${formatCurrency(tax)}
                    </span>
                  </div>
                )}

                {tip > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tip:</span>
                    <span className="text-foreground font-medium">
                      ${formatCurrency(tip)}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between font-semibold text-base">
                  <span>Total:</span>
                  <span>${formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

