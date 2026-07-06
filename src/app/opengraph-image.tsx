import { ImageResponse } from "next/og";

/** Social share card (Open Graph / Twitter) for rkept.com links. */
export const alt = "Kept — never lose a lead again. Lead follow-up, reminders & invoicing for one-person businesses.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#101211",
          color: "#f5f4ef",
          position: "relative",
        }}
      >
        {/* logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #2a78d6 0%, #1c5cab 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 64 64">
              <path
                d="m17 35 11 11 19-20"
                fill="none"
                stroke="#fff"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>
            kept<span style={{ color: "#3987e5" }}>.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Never lose a lead again.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 32,
            lineHeight: 1.4,
            color: "#c3c2b7",
            maxWidth: 900,
          }}
        >
          Instant alerts, relentless follow-up reminders, quotes & invoices — one place, built
          for one-person businesses.
        </div>

        <div style={{ display: "flex", marginTop: 44, gap: 16 }}>
          {["From $9/mo", "3-day free trial", "Free invoice generator"].map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 999,
                border: "2px solid #2c2c2a",
                fontSize: 26,
                color: "#f5f4ef",
              }}
            >
              {chip}
            </div>
          ))}
        </div>

        {/* marker-yellow corner accent */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 260,
            height: 260,
            borderRadius: 130,
            background: "#ffdf57",
            opacity: 0.9,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
