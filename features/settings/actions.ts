"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { profileSchema } from "@/features/tabs/schema";

export interface ProfileFormState {
  status: "idle" | "saved" | "error";
  message?: string;
}

export async function updateProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getUser();
  if (!user) return { status: "error", message: "Your session expired. Sign in again." };

  const parsed = profileSchema.safeParse({
    paymentMessage: formData.get("paymentMessage"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ payment_message: parsed.data.paymentMessage, currency: parsed.data.currency })
    .eq("id", user.id);
  if (error) {
    console.error("update profile failed", error);
    return { status: "error", message: "Couldn't save your settings. Try again." };
  }

  revalidatePath("/settings");
  return { status: "saved" };
}
