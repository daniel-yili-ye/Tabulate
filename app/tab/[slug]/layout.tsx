import { Metadata } from "next";
import { getTabData } from "@/lib/supabase/server";

function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const tabData = await getTabData(slug);

    if (!tabData) {
      return {
        title: "Tab Not Found | Tabulate",
        description: "Split bills with friends easily",
      };
    }

    const businessName =
      tabData.form_data.stepItems.businessName || "Unnamed Business";
    const date = tabData.form_data.stepItems.date;
    const formattedDate = date ? formatDate(date) : "No date";

    return {
      title: `${businessName} - ${formattedDate} | Tabulate`,
      description: `View your bill split for ${businessName} from ${formattedDate}`,
      openGraph: {
        title: `${businessName} - ${formattedDate}`,
        description: `View your bill split for ${businessName}`,
        type: "website",
        siteName: "Tabulate",
      },
      twitter: {
        card: "summary_large_image",
        title: `${businessName} - ${formattedDate}`,
        description: `View your bill split for ${businessName}`,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Tabulate",
      description: "Split bills with friends easily",
    };
  }
}

export default function TabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
