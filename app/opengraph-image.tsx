import { ImageResponse } from "next/og";
import { formatCents } from "@/features/tabs/format";

export const alt = "Tabulate — split any receipt in under a minute";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The same example the homepage shows.
const EXAMPLE = [
  { name: "Maya", detail: "Margherita, ½ wine", cents: 3412 },
  { name: "Jordan", detail: "Rigatoni, ½ wine", cents: 3876 },
  { name: "Sam", detail: "Burrata, tiramisu", cents: 2759 },
];

/** The preview for the homepage, and for any page without one of its own. */
export default function OpenGraphImage() {
  const total = EXAMPLE.reduce((sum, person) => sum + person.cents, 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 72,
          background: "#ffffff",
          color: "#0a0a0a",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 560,
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 36, fontWeight: 600 }}>
            <svg width="56" height="56" viewBox="0 0 32 32" style={{ marginRight: 20 }}>
              <rect width="32" height="32" rx="8" fill="#0a0a0a" />
              <path d="M10 7h12v18l-3-2-3 2-3-2-3 2z" fill="#fff" />
              <path d="M13 12h6M13 16h6" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Tabulate
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
              Split any receipt in under a minute.
            </div>
            <div style={{ marginTop: 24, fontSize: 32, lineHeight: 1.3, color: "#737373" }}>
              Scan the bill, tap who had what, and send one link.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 420,
            padding: 32,
            border: "2px solid #e5e5e5",
            borderRadius: 28,
            background: "#ffffff",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28 }}>
            <div style={{ fontWeight: 600 }}>Osteria Lupo</div>
            <div style={{ color: "#737373" }}>{formatCents(total, "USD")}</div>
          </div>
          <div style={{ marginTop: 4, fontSize: 22, color: "#737373" }}>
            Tax and tip included
          </div>
          {EXAMPLE.map((person, index) => (
            <div
              key={person.name}
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: index === 0 ? 20 : 0,
                padding: "18px 0",
                borderTop: index === 0 ? "none" : "2px solid #e5e5e5",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  marginRight: 18,
                  borderRadius: 28,
                  background: "#f5f5f5",
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                {person.name[0]}
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 600 }}>{person.name}</div>
                <div style={{ fontSize: 20, color: "#737373" }}>{person.detail}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {formatCents(person.cents, "USD")}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
