import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { draftFromTab } from "@/features/tab-editor/draft";
import { TabEditor } from "@/features/tab-editor/tab-editor";
import { getSharedTab } from "@/features/tabs/queries";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit tab", robots: { index: false } };

export default async function EditTabPage({ params }: PageProps<"/tab/[slug]/edit">) {
  const { slug } = await params;
  const user = await requireUser(`/tab/${slug}/edit`);
  const tab = await getSharedTab(slug);
  // Only the owner may edit; everyone else gets the same 404 as a missing tab.
  if (!tab?.isOwner) notFound();

  return <TabEditor userId={user.id} slug={tab.slug} initialDraft={draftFromTab(tab)} />;
}
