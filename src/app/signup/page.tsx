import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign Up — Free 3-Day Trial, No Card Needed",
  description:
    "Create your Kept account: instant lead alerts, follow-up reminders, quotes and invoices in one place. Full access free for 3 days.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
