import Link from "next/link";
import { cn } from "@/lib/utils";

/** The receipt mark. Mirrors app/icon.svg so the favicon and header match. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-6", className)}>
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <path d="M10 7h12v18l-3-2-3 2-3-2-3 2z" className="fill-background" />
      <path
        d="M13 12h6M13 16h6"
        className="stroke-foreground"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-base font-semibold tracking-tight"
    >
      <LogoMark />
      Tabulate
    </Link>
  );
}
