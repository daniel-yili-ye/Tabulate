import { SiteHeader } from "@/components/site-header";
import { getUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-16">
        {children}
      </main>
    </>
  );
}
