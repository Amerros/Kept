import type { Metadata } from "next";
import Link from "next/link";
import { getInvoices, getLeads } from "@/lib/data";
import { formatMoney, timeAgo } from "@/lib/format";
import { invoiceTotals, type Invoice, type Lead } from "@/lib/types";

export const metadata: Metadata = { title: "Clients" };

/**
 * Client directory — built automatically by matching leads and invoices on
 * email (fallback: phone, then name). No separate "contacts" to maintain:
 * everyone you've ever talked to or billed, with their full history, in
 * one place.
 */

interface ClientRow {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  leads: Lead[];
  invoices: Invoice[];
}

function clientKey(email?: string | null, phone?: string | null, name?: string | null): string {
  if (email?.trim()) return `e:${email.trim().toLowerCase()}`;
  if (phone?.trim()) return `p:${phone.replace(/\s/g, "")}`;
  return `n:${(name ?? "").trim().toLowerCase()}`;
}

export default async function ClientsPage() {
  const [leads, invoices] = await Promise.all([getLeads(), getInvoices()]);

  const clients = new Map<string, ClientRow>();
  const upsert = (key: string, name: string, email: string | null, phone: string | null) => {
    const existing = clients.get(key);
    if (existing) {
      existing.name = existing.name || name;
      existing.email = existing.email ?? email;
      existing.phone = existing.phone ?? phone;
      return existing;
    }
    const row: ClientRow = { key, name, email, phone, leads: [], invoices: [] };
    clients.set(key, row);
    return row;
  };

  for (const lead of leads) {
    const row = upsert(clientKey(lead.email, lead.phone, lead.name), lead.name ?? "", lead.email, lead.phone);
    row.leads.push(lead);
  }
  for (const inv of invoices) {
    if (!inv.client_name && !inv.client_email) continue;
    const row = upsert(clientKey(inv.client_email, null, inv.client_name), inv.client_name, inv.client_email, null);
    row.invoices.push(inv);
  }

  const currency = invoices[0]?.currency ?? "EUR";
  const rows = [...clients.values()]
    .filter((c) => c.name || c.email || c.phone)
    .map((c) => {
      const paid = c.invoices
        .filter((i) => i.doc_type !== "quote" && i.status === "paid")
        .reduce((sum, i) => sum + invoiceTotals(i.items, i.tax_rate, i.discount).total, 0);
      const open = c.invoices
        .filter((i) => i.doc_type !== "quote" && i.status === "sent")
        .reduce((sum, i) => sum + invoiceTotals(i.items, i.tax_rate, i.discount).total, 0);
      const won = c.leads.filter((l) => l.status === "won").length;
      const lastActivity = [
        ...c.leads.map((l) => l.created_at),
        ...c.invoices.map((i) => i.created_at),
      ]
        .sort()
        .pop();
      const latestLead = c.leads.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      return { ...c, paid, open, won, lastActivity, latestLead };
    })
    .sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));

  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-ink-2">
          Everyone you&apos;ve talked to or billed — matched up automatically from your leads
          and invoices. No contact list to maintain.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-surface p-12 text-center">
          <p className="font-display text-xl font-bold">No clients yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">
            As soon as leads or invoices come in, everyone shows up here automatically with
            their full history.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-2">
            <span className="font-semibold text-ink">{rows.length}</span>{" "}
            {rows.length === 1 ? "client" : "clients"} ·{" "}
            <span className="font-semibold text-ink">{formatMoney(totalPaid, currency)}</span>{" "}
            collected all-time
          </p>
          <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
            <table className="w-full text-sm" style={{ minWidth: "46rem" }}>
              <thead>
                <tr className="border-b border-hairline text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5 text-right">Enquiries</th>
                  <th className="px-5 py-3.5 text-right">Jobs won</th>
                  <th className="px-5 py-3.5 text-right">Paid</th>
                  <th className="px-5 py-3.5 text-right">Outstanding</th>
                  <th className="px-5 py-3.5">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.key} className="border-b border-hairline transition-colors last:border-0 hover:bg-raised">
                    <td className="px-5 py-4 font-medium text-ink">
                      {c.latestLead ? (
                        <Link href={`/dashboard/leads/${c.latestLead.id}`} className="text-accent hover:underline">
                          {c.name || "—"}
                        </Link>
                      ) : (
                        c.name || "—"
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink-2">
                      {c.email ?? c.phone ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-ink-2">{c.leads.length}</td>
                    <td className="px-5 py-4 text-right tabular-nums text-ink-2">{c.won}</td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums text-good">
                      {c.paid > 0 ? formatMoney(c.paid, currency) : "—"}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {c.open > 0 ? (
                        <span className="font-semibold text-warning">{formatMoney(c.open, currency)}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {c.lastActivity ? timeAgo(c.lastActivity) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
