"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setPending(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={pending}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink disabled:opacity-60"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
