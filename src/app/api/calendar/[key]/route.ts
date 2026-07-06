import { getAdminSupabase } from "@/lib/supabase/admin";

/**
 * Read-only calendar subscription feed (.ics).
 * The owner adds this URL once in Google Calendar ("Other calendars → From
 * URL"), Apple Calendar or Outlook, and every appointment booked in Kept
 * syncs automatically. Authenticated by the private calendar_key — separate
 * from intake_key, which is exposed in public form HTML.
 */

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function icsStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const supabase = getAdminSupabase();
  if (!supabase) return new Response("Not configured", { status: 503 });

  const { data: business } = await supabase
    .from("lf_businesses")
    .select("id,name")
    .eq("calendar_key", key.replace(/\.ics$/, ""))
    .maybeSingle();
  if (!business) return new Response("Not found", { status: 404 });

  const { data: leads } = await supabase
    .from("lf_leads")
    .select("id,name,phone,email,message,appointment_at")
    .eq("business_id", business.id)
    .not("appointment_at", "is", null)
    .order("appointment_at")
    .limit(500);

  const now = icsStamp(new Date().toISOString());
  const events = (leads ?? []).flatMap((lead) => {
    const start = lead.appointment_at as string;
    const end = new Date(new Date(start).getTime() + 60 * 60_000).toISOString();
    const details = [
      lead.phone && `Phone: ${lead.phone}`,
      lead.email && `Email: ${lead.email}`,
      lead.message && `“${lead.message}”`,
    ]
      .filter(Boolean)
      .join("\n");
    return [
      "BEGIN:VEVENT",
      `UID:kept-${lead.id}@rkept.com`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${icsEscape(`${lead.name || "Appointment"} — ${business.name}`)}`,
      details ? `DESCRIPTION:${icsEscape(details)}` : null,
      "END:VEVENT",
    ].filter((l): l is string => l !== null);
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kept//rkept.com//EN",
    `X-WR-CALNAME:${icsEscape(`Kept — ${business.name}`)}`,
    "X-PUBLISHED-TTL:PT1H",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
