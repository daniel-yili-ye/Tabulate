import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

interface SiteHeaderProps {
  /** Omit on static pages: the header then links to the app instead. */
  user?: { email: string | null } | null;
  className?: string;
}

export function SiteHeader({ user, className = "max-w-xl" }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className={`mx-auto flex h-14 items-center justify-between px-4 ${className}`}>
        <Logo href={user ? "/tabs" : "/"} />
        <nav className="flex items-center gap-1">
          <ThemeToggle />
          {user ? (
            <UserMenu email={user.email} />
          ) : (
            <Button asChild size="sm" variant={user === null ? "default" : "outline"}>
              <Link href={user === null ? "/login" : "/tabs"}>
                {user === null ? "Sign in" : "Open app"}
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
