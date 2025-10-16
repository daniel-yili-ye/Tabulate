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

function calculateFontSize(text: string, maxWidth: number = 320): number {
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

function calculateDateFontSize(text: string, maxWidth: number = 320): number {
  // Base font size for date (smaller than business name)
  const baseFontSize = 16;
  const minFontSize = 12;

  // For regular weight fonts, chars are ~0.5 * fontSize wide on average
  const charWidthRatio = 0.5;
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
      const fallbackTitle = "Tabulate";
      const fallbackSubtitle = "Split the tab with friends";
      const fallbackTitleFontSize = calculateFontSize(fallbackTitle);
      const fallbackSubtitleFontSize = calculateDateFontSize(fallbackSubtitle);

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
                fontSize: fallbackTitleFontSize,
                textAlign: "left",
                color: "black",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              {fallbackTitle}
            </div>
            <div
              style={{
                fontSize: fallbackSubtitleFontSize,
                color: "grey",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fallbackSubtitle}
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

    // Calculate dynamic font sizes
    const dynamicFontSize = calculateFontSize(businessName);
    const dynamicDateFontSize = calculateDateFontSize(formattedDate);

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
              fontSize: dynamicFontSize,
              fontWeight: 900,
              textAlign: "left",
              color: "black",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            {businessName}
          </div>
          <div
            style={{
              fontSize: dynamicDateFontSize,
              color: "grey",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
    const errorTitle = "Tabulate";
    const errorSubtitle = "Split the tab with friends";
    const errorTitleFontSize = calculateFontSize(errorTitle);
    const errorSubtitleFontSize = calculateDateFontSize(errorSubtitle);

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
              fontSize: errorTitleFontSize,
              fontWeight: 900,
              textAlign: "left",
              color: "black",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            {errorTitle}
          </div>
          <div
            style={{
              fontSize: errorSubtitleFontSize,
              color: "grey",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {errorSubtitle}
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  }
}
