"use client";

import { useState, type ComponentProps } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDate, parseIsoDate, toIsoDate } from "@/features/tabs/format";
import { cn } from "@/lib/utils";

interface DatePickerProps
  extends Omit<ComponentProps<typeof Button>, "value" | "onChange"> {
  /** A calendar day as YYYY-MM-DD, or "" when none is picked. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** A single calendar day, picked from a popover calendar. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value) ?? undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
          {...props}
        >
          <CalendarIcon data-icon="inline-start" />
          <span className="truncate">
            {selected ? formatDate(value, "long") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          required
          autoFocus
          defaultMonth={selected}
          selected={selected}
          onSelect={(next) => {
            onChange(toIsoDate(next));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
