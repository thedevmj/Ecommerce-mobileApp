"use server";

import { redirect } from "next/navigation";
import type { AccountActionState } from "@/lib/account";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(
  _previous: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "Use at least 8 characters for the new password." };
  }

  if (password !== confirmPassword) {
    return { error: "The new passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "This reset link is invalid or expired. Request a new password reset email.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  await supabase.auth.signOut();
  redirect("/login?reset=1");
}
