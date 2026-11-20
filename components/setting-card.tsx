import { cn } from "@/lib/utils";

interface SettingCardProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Dashed outline, for something that has not been set up yet. */
  empty?: boolean;
  /** The control on the right: a button, a switch, a toggle. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * One option on a tab's page: an icon, what it is, and its control on the
 * right. The text wraps so that the control stays put on narrow screens.
 */
export function SettingCard({
  icon,
  title,
  description,
  empty = false,
  children,
  className,
}: SettingCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4",
        empty ? "border-dashed" : "bg-muted/40",
        className,
      )}
    >
      <span className="shrink-0 text-muted-foreground [&_svg]:size-5">{icon}</span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="break-words whitespace-pre-wrap text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-1">{children}</div>}
    </div>
  );
}
