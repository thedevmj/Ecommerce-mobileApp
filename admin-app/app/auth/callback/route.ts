import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedNextPaths = new Set(["/reset-password", "/dashboard/account"]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flowId = url.searchParams.get("sb_flow_id") ?? undefined;
  const requestedNext = url.searchParams.get("next");
  const nextPath =
    requestedNext && allowedNextPaths.has(requestedNext)
      ? requestedNext
      : "/reset-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined
    );

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL(
      "/login?error=The+confirmation+link+is+invalid+or+expired.",
      url.origin
    )
  );
}
