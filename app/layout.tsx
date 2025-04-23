import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import QueryProvider from "@/components/providers/QueryProvider";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Tabulate",
  description: "Split bills with friends easily",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

        {/* iPhone/iPad (iOS 7+) */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/icon-180x180.png"
        />

        {/* iPad Pro */}
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/icons/icon-167x167.png"
        />

        {/* iPad & iPad mini */}
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/icon-152x152.png"
        />

        {/* iPhone */}
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/icons/icon-120x120.png"
        />

        {/* Fallback */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          <main className="container">
            <header className="py-4 sticky top-0 z-50 w-full bg-background m-auto md:max-w-xl">
              <a href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-bold">Tabulate</h1>
              </a>
            </header>
            <div className="py-4 m-auto md:max-w-xl mb-6">{children}</div>
          </main>
        </QueryProvider>
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}
