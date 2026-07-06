import { ImageResponse } from "next/og";

/** iOS/Safari home-screen icon — matches icon.svg (Kept check + marker dot). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2a78d6 0%, #1c5cab 100%)",
          borderRadius: 40,
          position: "relative",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path
            d="m17 35 11 11 19-20"
            fill="none"
            stroke="#fff"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: 22,
            right: 22,
            width: 34,
            height: 34,
            borderRadius: 17,
            background: "#ffdf57",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
