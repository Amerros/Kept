import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const SITE_URL = "https://www.rkept.com";
const SITE_TITLE = "Kept — Never Lose a Lead: Follow-Up Reminders & Invoicing";
const SITE_DESCRIPTION =
  "Kept captures every lead, reminds you until you've replied, and turns won jobs into quotes and invoices. Built for solo trades & freelancers. Free 3-day trial, from $9/mo.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Kept",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Kept",
  keywords: [
    "lead follow-up software",
    "lead management for small business",
    "never lose a lead",
    "invoicing for freelancers",
    "invoice software for tradesmen",
    "CRM for one-person business",
    "quote to invoice",
    "recurring invoices",
    "free invoice generator",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Kept",
    locale: "en_US",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions inject styles (isolation,
          user-select) into the served HTML before React hydrates. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
