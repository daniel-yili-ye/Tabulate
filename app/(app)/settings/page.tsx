import type { Metadata } from "next";
import { SettingsForm } from "@/features/settings/settings-form";
import { getMyProfile } from "@/features/tabs/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const profile = await getMyProfile(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Signed in as {user.email ?? "your account"}.
        </p>
      </div>
      <SettingsForm profile={profile} />
    </div>
  );
}
