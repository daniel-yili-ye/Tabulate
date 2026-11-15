import { ImageResponse } from "next/og";

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
          background: "#0a0a0a",
        }}
      >
        <svg width="124" height="124" viewBox="4 3 24 24">
          <path d="M10 7h12v18l-3-2-3 2-3-2-3 2z" fill="#fff" />
          <path
            d="M13 12h6M13 16h6"
            stroke="#0a0a0a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  );
}
