import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPlanContext } from "@/lib/data";
import { planAllows } from "@/lib/plan";
import { googleAuthUrl, isGoogleConfigured } from "@/lib/google";

/** Kicks off the "Connect Gmail" OAuth flow for the signed-in owner. */
export async function GET(request: NextRequest) {
  if (!isGoogleConfigured) {
    return NextResponse.redirect(new URL("/dashboard/settings?gmail=unconfigured", request.url));
  }

  const supabase = await getServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  // "Send as your own email" is a Pro feature.
  const { plan, trialEndsAt } = await getPlanContext();
  if (!planAllows(plan, "gmail_send", trialEndsAt)) {
    return NextResponse.redirect(new URL("/dashboard/settings?gmail=upgrade", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(googleAuthUrl(request.nextUrl.origin, state));
  response.cookies.set("lf_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/api/google",
  });
  return response;
}
