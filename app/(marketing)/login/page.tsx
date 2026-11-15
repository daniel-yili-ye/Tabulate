import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { SiteHeader } from "@/components/site-header";
import { safeNextPath } from "@/features/auth/redirect";
import { LoginForm } from "@/features/auth/login-form";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  oauth: "Couldn't sign in with Google. Try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getUser()) redirect(next);

  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <>
      <SiteHeader className="max-w-5xl" />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <div className="mb-8 space-y-2 text-center">
          <LogoMark className="mx-auto size-10" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to Tabulate
          </h1>
          <p className="text-sm text-muted-foreground">
            Save your tabs, edit them later and add your payment note.
          </p>
        </div>
        <LoginForm next={next} error={error} />
      </main>
    </>
  );
}
