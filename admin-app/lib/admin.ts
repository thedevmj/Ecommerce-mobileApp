import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getAdminIdentity = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      error: "Your session has expired. Sign in again.",
      roleColumnMissing: false,
    } as const;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const roleColumnMissing =
    error?.code === "42703" || Boolean(error?.message.includes("role"));

  return {
    supabase,
    user,
    profile,
    error: error?.message ?? null,
    roleColumnMissing,
  } as const;
});

export async function getAdminSession() {
  const { supabase, user, profile, error } = await getAdminIdentity();

  if (!user) {
    return { error: "Your session has expired. Sign in again." } as const;
  }

  if (error) {
    return { error } as const;
  }

  if (profile?.role !== "admin") {
    return { error: "Admin access is required." } as const;
  }

  return { supabase, user, profile } as const;
}
