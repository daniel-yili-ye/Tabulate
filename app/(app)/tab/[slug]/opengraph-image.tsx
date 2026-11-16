import { ImageResponse } from "next/og";
import { formatCents, formatDate } from "@/features/tabs/format";
import { getSharedTab } from "@/features/tabs/queries";
import { computeSplit } from "@/features/tabs/split";

export const alt = "Tabulate bill split";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tab = await getSharedTab(slug).catch(() => null);

  const title = tab?.businessName ?? "Tabulate";
  const subtitle = tab
    ? `${formatDate(tab.date, "long")} · ${formatCents(computeSplit(tab).totalCents, tab.currency)} · ${tab.participants.length} people`
    : "Split any receipt with friends";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#ffffff",
          color: "#0a0a0a",
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
          <div
            style={{
              fontSize: title.length > 24 ? 72 : 104,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            {title.length > 60 ? `${title.slice(0, 59)}…` : title}
          </div>
          <div style={{ marginTop: 24, fontSize: 40, color: "#737373" }}>{subtitle}</div>
        </div>
      </div>
    ),
    size,
  );
}
