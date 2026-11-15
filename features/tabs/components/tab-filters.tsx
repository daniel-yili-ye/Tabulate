"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CalendarIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate, parseIsoDate, toIsoDate } from "../format";
import { LIMITS } from "../limits";

export interface TabFilterValues {
  search: string;
  from: string;
  to: string;
}

const serialize = (values: TabFilterValues) =>
  [values.search, values.from, values.to].join("\n");

function rangeLabel({ from, to }: TabFilterValues): string {
  if (!from) return to ? `Until ${formatDate(to)}` : "Any date";
  if (!to) return `From ${formatDate(from)}`;
  return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;
}

/** Search and date range for the tab list. The filters live in the URL. */
export function TabFilters({ applied }: { applied: TabFilterValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState(applied);
  // The filters this component last asked the URL to show.
  const [requested, setRequested] = useState(serialize(applied));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The URL changed from outside (back button, a link): show what it says.
  if (!pending && serialize(applied) !== requested) {
    setRequested(serialize(applied));
    setValues(applied);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const apply = (next: TabFilterValues, delay: number) => {
    setValues(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const clean = { ...next, search: next.search.trim() };
      const params = new URLSearchParams();
      if (clean.search) params.set("q", clean.search);
      if (clean.from) params.set("from", clean.from);
      if (clean.to) params.set("to", clean.to);
      const query = params.toString();
      setRequested(serialize(clean));
      // Changing a filter always starts again from the first page.
      startTransition(() =>
        router.replace((query ? `/tabs?${query}` : "/tabs") as Route, { scroll: false }),
      );
    }, delay);
  };

  const range = {
    from: parseIsoDate(values.from) ?? undefined,
    to: parseIsoDate(values.to) ?? undefined,
  };
  const active = values.search || values.from || values.to;

  return (
    <div className="space-y-3" aria-busy={pending}>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          aria-label="Search tabs by name"
          placeholder="Search tabs"
          maxLength={LIMITS.businessNameLength}
          value={values.search}
          onChange={(event) => apply({ ...values, search: event.target.value }, 300)}
        />
      </InputGroup>

      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "min-w-0 flex-1 justify-start font-normal",
                !values.from && "text-muted-foreground",
              )}
            >
              <CalendarIcon data-icon="inline-start" />
              <span className="truncate">{rangeLabel(values)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              autoFocus
              defaultMonth={range.from}
              selected={range}
              onSelect={(next) =>
                apply(
                  {
                    ...values,
                    from: next?.from ? toIsoDate(next.from) : "",
                    to: next?.to ? toIsoDate(next.to) : "",
                  },
                  300,
                )
              }
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
        {active && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => apply({ search: "", from: "", to: "" }, 0)}
          >
            <XIcon data-icon="inline-start" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
