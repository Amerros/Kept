# Kept — never lose a lead again

Lead follow-up & invoicing for solo service businesses.

Kept captures leads (website form, manual entry), **alerts the owner instantly**,
keeps reminding them at **24 h / 48 h / 3 days** until the lead is answered or closed,
tracks everything in a four-column pipeline (**New → Contacted → Won → Lost**),
and makes clean, print-ready **invoices in under a minute** — including a free
public invoice generator at `/invoice-generator` (no account needed).

> **v1 is owner-only:** Kept only ever emails *you*, the owner. Auto-replies and
> follow-ups to customers (email / WhatsApp / SMS) are schema-ready but disabled
> until a later version.

## Stack

- **Next.js 16** (App Router, React 19, Tailwind v4)
- **Supabase** (Postgres + Auth + RLS) — schema in `supabase/migrations/`
- Owner notifications via **Resend** (optional; everything degrades gracefully)

> The Supabase project is **shared with other apps**. Every Kept object is
> prefixed `lf_` (tables, functions, triggers) and the signup trigger only
> provisions users whose metadata carries `lf_app: "kept"` — other apps'
> tables, functions and signups are never touched.

## Run it (demo mode — zero setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Supabase keys the app runs in **demo mode**:
dashboard, pipeline, lead details, invoices and settings are fully browsable
with sample data.

## Go live

1. Fill in the Supabase URL + keys in `.env.local`.
2. Apply the schema — either paste `supabase/migrations/20260704000000_init.sql`
   into the Supabase dashboard **SQL editor**, or:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```
3. Restart `npm run dev` — signup now provisions a business with the default
   owner-reminder sequence (see `lf_handle_new_user()` in the migration).
4. Optional: set `RESEND_API_KEY` for real owner-alert emails, and hit
   `GET /api/cron` (header `Authorization: Bearer $CRON_SECRET`) every few
   minutes to deliver due reminders.

## Project map

| Path | What |
|---|---|
| `src/app/page.tsx` | Marketing landing page |
| `src/app/invoice-generator` | Free public invoice maker (no account) |
| `src/app/login`, `src/app/signup` | Auth (Supabase, demo-aware) |
| `src/proxy.ts` | Session refresh + `/dashboard` auth guard |
| `src/app/dashboard` | KPI tiles, 14-day trend, pipeline, quick-add, CSV export |
| `src/app/dashboard/leads/[id]` | Lead detail: conversation, reminders, notes |
| `src/app/dashboard/invoices` | Invoice list / editor / print (PDF via browser) |
| `src/app/dashboard/settings` | Alerts, reminder sequence, capture-form snippet, invoice defaults |
| `src/app/api/intake` | Public lead intake (embeddable form posts here) |
| `src/app/api/cron` | Follow-up worker — owner reminders only in v1 |
| `src/lib/data.ts` | Data layer — Supabase queries with demo-data fallback |
| `supabase/migrations/` | Full `lf_*` schema: businesses, leads, follow_ups, messages, invoices, RLS |

## Roadmap

- [ ] Customer auto-replies + follow-ups (Resend to leads, templates already stored)
- [ ] Twilio adapter (WhatsApp inbound webhook + WhatsApp/SMS sends)
- [ ] Email invoices straight to clients
- [ ] Stripe billing (€9 / €29 / €49)
