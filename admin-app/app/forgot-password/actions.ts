"use server";

import {
  formText,
  isEmail,
  normalizeEmail,
  type AccountActionState,
} from "@/lib/account";
import { getRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(
  _previous: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const email = normalizeEmail(formText(formData, "email", 254));

  if (!isEmail(email)) {
    return { error: "Enter a valid login email." };
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      error:
        "Could not send a reset email right now. Wait a moment and try again.",
    };
  }

  return {
    ok: true,
    message:
      "If that email belongs to an admin account, a reset link is on its way.",
  };
}
