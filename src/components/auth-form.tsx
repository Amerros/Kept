"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!supabase) {
      setNotice(
        "Kept isn't connected to a database yet (no Supabase keys configured). Explore the demo dashboard instead — everything works with sample data."
      );
      return;
    }

    setPending(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // lf_app tags this signup as ours — the shared Supabase project only
            // provisions a Kept business for users carrying this flag.
            data: { lf_app: "kept", business_name: businessName || "My Business" },
          },
        });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation is on — no session until the link is clicked.
          setNotice(
            `Almost there! We've sent a confirmation link to ${email}. Click it, then log in.`
          );
          return;
        }
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-hairline bg-surface p-7 shadow-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-ink-2">
          {isLogin
            ? "Log in to see your leads."
            : "Set up in minutes. Free for 3 days."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Business name</span>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Van Dijk Home Services"
                className="w-full rounded-lg border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="w-full rounded-lg border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-hairline bg-raised px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{error}</p>
          )}
          {notice && (
            <div className="rounded-lg bg-accent-wash px-3.5 py-2.5 text-sm text-ink-2">
              <p>{notice}</p>
              {!supabase && (
                <Link
                  href="/dashboard"
                  className="mt-2 inline-block font-semibold text-accent hover:underline"
                >
                  Open the demo dashboard →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60"
          >
            {pending ? "One moment…" : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-2">
          {isLogin ? (
            <>
              New to Kept?{" "}
              <Link href="/signup" className="font-medium text-accent hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-accent hover:underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
      <p className="mt-6 text-sm text-muted">
        Just looking?{" "}
        <Link href="/dashboard" className="font-medium text-accent hover:underline">
          Explore the demo
        </Link>
      </p>
    </div>
  );
}
