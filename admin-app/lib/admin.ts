import { createClient } from "@/lib/supabase/server";

export async function getAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session has expired. Sign in again." } as const;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { error: error.message } as const;
  }

  if (profile?.role !== "admin") {
    return { error: "Admin access is required." } as const;
  }

  return { supabase, user } as const;
}
