"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin";
import {
  formText,
  isEmail,
  normalizeEmail,
  type AccountActionState,
} from "@/lib/account";
import { getRequestOrigin } from "@/lib/request-origin";

export async function updateAccountDetails(
  _previous: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const fullName = formText(formData, "full_name", 120);
  const phone = formText(formData, "phone", 40);
  const email = normalizeEmail(formText(formData, "email", 254));

  if (!isEmail(email)) {
    return { error: "Enter a valid login email." };
  }

  const { error: profileError } = await session.supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      phone: phone || null,
    })
    .eq("id", session.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  const currentEmail = session.user.email?.toLowerCase() ?? "";
  let message = "Account details saved.";

  if (email !== currentEmail) {
    const origin = await getRequestOrigin();
    const { data, error: emailError } = await session.supabase.auth.updateUser(
      { email },
      {
        emailRedirectTo: `${origin}/auth/callback?next=/dashboard/account`,
      }
    );

    if (emailError) {
      revalidatePath("/dashboard/account");
      return {
        error: `Your name and phone were saved, but the email change failed: ${emailError.message}`,
      };
    }

    message =
      data.user?.email?.toLowerCase() === email
        ? `Account details saved. Your login email is now ${email}.`
        : `Account details saved. Check ${email} to confirm the new login email.`;
  }

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard", "layout");

  return { ok: true, message };
}

export async function sendAccountPasswordReset(): Promise<AccountActionState> {
  const session = await getAdminSession();

  if ("error" in session) return { error: session.error };

  const email = session.user.email;

  if (!email) {
    return {
      error:
        "This admin account has no login email. Add one before requesting a reset.",
    };
  }

  const origin = await getRequestOrigin();
  const { error } = await session.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      error: `Could not send the reset email: ${error.message}`,
    };
  }

  return {
    ok: true,
    message: `Password reset email sent to ${email}. Check the inbox and follow the link.`,
  };
}
