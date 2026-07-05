"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  convertQuoteToInvoice,
  deleteInvoice,
  duplicateInvoice,
  setInvoiceStatus,
} from "@/app/dashboard/invoices/actions";
import { INVOICE_STATUS_LABELS, type DocType, type InvoiceStatus } from "@/lib/types";

export function InvoiceStatusBar({
  invoiceId,
  status,
  docType = "invoice",
}: {
  invoiceId: string;
  status: InvoiceStatus;
  docType?: DocType;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function changeStatus(next: InvoiceStatus) {
    startTransition(async () => {
      const res = await setInvoiceStatus(invoiceId, next);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const res = await deleteInvoice(invoiceId);
      if (!res.ok) setError(res.error);
      else router.push("/dashboard/invoices");
    });
  }

  const btn =
    "rounded-lg border border-hairline px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50";

  return (
    <div className="print-hidden flex flex-wrap items-center gap-2.5 rounded-2xl border border-hairline bg-surface p-3">
      <span className="px-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        Status: {INVOICE_STATUS_LABELS[status]}
      </span>
      {docType === "quote" && (
        <button
          className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await convertQuoteToInvoice(invoiceId);
              if (!res.ok) setError(res.error);
              else router.refresh();
            })
          }
        >
          Accepted → convert to invoice
        </button>
      )}
      <button
        className={btn}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await duplicateInvoice(invoiceId);
            if (!res.ok) setError(res.error);
            else if ("id" in res && res.id) router.push(`/dashboard/invoices/${res.id}`);
          })
        }
      >
        Duplicate
      </button>
      {status !== "sent" && status !== "paid" && (
        <button className={btn} disabled={pending} onClick={() => changeStatus("sent")}>
          Mark as sent
        </button>
      )}
      {status !== "paid" && docType !== "quote" && (
        <button
          className="rounded-lg bg-good-badge px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={pending}
          onClick={() => changeStatus("paid")}
        >
          Mark as paid 🎉
        </button>
      )}
      {status === "paid" && (
        <button className={btn} disabled={pending} onClick={() => changeStatus("sent")}>
          Undo paid
        </button>
      )}
      {status !== "void" && (
        <button className={btn} disabled={pending} onClick={() => changeStatus("void")}>
          Void
        </button>
      )}
      <button
        className="ml-auto rounded-lg px-3.5 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
        disabled={pending}
        onClick={handleDelete}
        onBlur={() => setConfirmDelete(false)}
      >
        {confirmDelete ? "Really delete?" : "Delete"}
      </button>
      {error && <span className="w-full px-1.5 text-xs text-danger">{error}</span>}
    </div>
  );
}
