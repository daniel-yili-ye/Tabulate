import type { Metadata } from "next";
import { emptyDraft } from "@/features/tab-editor/draft";
import { TabEditor } from "@/features/tab-editor/tab-editor";
import { getMyProfile } from "@/features/tabs/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New tab" };

export default async function NewTabPage() {
  const user = await requireUser("/tabs/new");
  const { paymentMessage, currency } = await getMyProfile(user.id);

  // The draft is built here so its ids match between server and client render.
  return (
    <TabEditor
      userId={user.id}
      slug={null}
      initialDraft={emptyDraft(paymentMessage, currency)}
    />
  );
}
