import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/features/auth/redirect";
import { createClient } from "@/lib/supabase/server";

/** Completes sign in: Google sends people back here with a one-time `code`. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");

  let signedIn = false;
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    signedIn = !error;
  }

  return NextResponse.redirect(
    signedIn
      ? `${origin}${next}`
      : `${origin}/login?error=oauth&next=${encodeURIComponent(next)}`,
  );
}
