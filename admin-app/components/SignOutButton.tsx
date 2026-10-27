"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-2 text-sm font-medium text-muted transition hover:border-slate-300 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut size={16} />
      {busy ? "Signing out" : "Sign out"}
    </button>
  );
}
