/**
 * Gmail OAuth (send-only scope). Lets an owner connect their own Gmail so
 * Kept can send email *as them* — the engine behind the upcoming premium
 * customer auto-replies. We never read their inbox: the only scope requested
 * is gmail.send, and we only call the API when there's something to send.
 */

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const SCOPE = "https://www.googleapis.com/auth/gmail.send email";

export const isGoogleConfigured = Boolean(CLIENT_ID && CLIENT_SECRET);

export function googleRedirectUri(origin: string) {
  return `${origin}/api/google/callback`;
}

export function googleAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // ask for a refresh token
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeGoogleCode(origin: string, code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
      code,
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    id_token?: string;
  };
}

/** Email address from the id_token (we asked for the `email` scope). */
export function emailFromIdToken(idToken: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")
    );
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${await res.text()}`);
  return (await res.json()) as { access_token: string; expires_in: number };
}

/**
 * Send an email as the connected Gmail account. Not called anywhere in v1
 * (customer sends are disabled) — this powers the premium auto-reply launch.
 */
export async function sendViaGmail(opts: {
  accessToken: string;
  fromEmail: string;
  fromName?: string;
  to: string;
  subject: string;
  text: string;
}) {
  const from = opts.fromName ? `${opts.fromName} <${opts.fromEmail}>` : opts.fromEmail;
  const raw = Buffer.from(
    [
      `From: ${from}`,
      `To: ${opts.to}`,
      `Subject: ${opts.subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      opts.text,
    ].join("\r\n")
  ).toString("base64url");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
  return (await res.json()) as { id: string };
}
