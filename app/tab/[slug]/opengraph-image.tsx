import { ImageResponse } from "next/og";
import { getTabData } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Tabulate - Bill Split Summary";
export const size = {
  width: 400,
  height: 150,
};
export const contentType = "image/png";

function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calculateFontSize(text: string, maxWidth: number = 480): number {
  // Base font size
  const baseFontSize = 64;
  const minFontSize = 32;

  // Approximate character width at base font size (rough estimate)
  // For bold fonts, chars are ~0.6 * fontSize wide on average
  const charWidthRatio = 0.6;
  const estimatedWidth = text.length * baseFontSize * charWidthRatio;

  if (estimatedWidth <= maxWidth) {
    return baseFontSize;
  }

  // Calculate adjusted font size
  const adjustedFontSize = Math.floor(
    maxWidth / (text.length * charWidthRatio)
  );

  // Return the larger of adjusted size or minimum size
  return Math.max(minFontSize, adjustedFontSize);
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const tabData = await getTabData(slug);

    if (!tabData) {
      // Return a default image if tab not found
      return new ImageResponse(
        (
          <div
            style={{
              fontFamily: "Inter",
              background: "white",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              padding: "20px 20px",
              color: "black",
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 900 }}>Tabulate</div>
            <div style={{ fontSize: 32, marginTop: 20, color: "grey" }}>
              Split bills with friends easily
            </div>
          </div>
        ),
        {
          ...size,
        }
      );
    }

    const businessName =
      tabData.form_data.stepItems.businessName || "Unnamed Business";
    const date = tabData.form_data.stepItems.date;
    const formattedDate = date ? formatDate(date) : "No date";

    // Calculate dynamic font size based on business name length
    const dynamicFontSize = calculateFontSize(businessName);

    return new ImageResponse(
      (
        <div
          style={{
            fontFamily: "Inter",
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "20px 20px",
            color: "white",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              textAlign: "left",
              color: "black",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {businessName}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "grey",
            }}
          >
            {formattedDate}
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    // Return default image on error
    return new ImageResponse(
      (
        <div
          style={{
            fontFamily: "Inter",
            background: "white",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: "20px 20px",
            color: "black",
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "Inter" }}>
            Tabulate
          </div>
          <div style={{ fontSize: 24, marginTop: 20, color: "grey" }}>
            Split bills with friends easily
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  }
}
