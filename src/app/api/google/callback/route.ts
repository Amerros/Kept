import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { emailFromIdToken, exchangeGoogleCode } from "@/lib/google";

/** Google redirects here after consent; stores the send-only tokens. */
export async function GET(request: NextRequest) {
  const back = (q: string) =>
    NextResponse.redirect(new URL(`/dashboard/settings?gmail=${q}`, request.url));

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get("lf_oauth_state")?.value;
  if (!code || !state || state !== cookieState) return back("error");

  const supabase = await getServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const admin = getAdminSupabase();
  if (!user || !admin) return back("error");

  const { data: business } = await admin
    .from("lf_businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) return back("error");

  try {
    const tokens = await exchangeGoogleCode(request.nextUrl.origin, code);
    // Without a refresh token we can't send later — treat as failure.
    if (!tokens.refresh_token) return back("error");

    const email = tokens.id_token ? emailFromIdToken(tokens.id_token) : null;
    const { error } = await admin.from("lf_email_connections").upsert({
      business_id: business.id,
      provider: "gmail",
      email: email ?? "unknown",
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      connected_at: new Date().toISOString(),
    });
    if (error) return back("error");
    return back("connected");
  } catch {
    return back("error");
  }
}
