import Link from "next/link";

/**
 * Kept mark: a chat bubble (every lead is a conversation) holding a bold
 * check (— handled), with the brand's marker-yellow notification dot.
 */
export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span className="relative inline-block transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
          <defs>
            <linearGradient id="kept-mark" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--accent-strong)" />
            </linearGradient>
          </defs>
          {/* chat bubble with tail */}
          <path
            d="M16 3C8.8 3 3 8.15 3 14.5c0 3.6 1.87 6.8 4.8 8.9-.15 1.9-.83 3.55-2.05 4.9-.3.34-.06 .88.39.84 2.73-.26 4.98-1.2 6.7-2.4 1 .17 2.06.26 3.16 .26 7.2 0 13-5.15 13-11.5S23.2 3 16 3Z"
            fill="url(#kept-mark)"
          />
          {/* check */}
          <path
            d="m10.5 15 3.8 3.8 7.2-7.3"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* unread-dot in marker yellow */}
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-marker ring-2 ring-background" />
      </span>
      <span
        className={
          "font-display text-[1.35rem] font-bold leading-none tracking-tight " +
          (light ? "text-ink-panel-text" : "text-ink")
        }
      >
        kept<span className="text-accent">.</span>
      </span>
    </Link>
  );
}
