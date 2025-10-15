import "@/app/globals.css";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/components/lib/utils";
import QueryProvider from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
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
    <html lang="en" suppressHydrationWarning>
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
          inter.variable
        )}
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <header className="py-4 sticky top-0 z-50 w-full bg-background">
              <div className="container">
                <div className="flex items-center justify-between m-auto md:max-w-xl">
                  <a href="/" className="hover:opacity-80 transition-opacity">
                    <h1 className="text-2xl font-bold">Tabulate</h1>
                  </a>
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className="container">
              <div className="pt-4 pb-12 m-auto md:max-w-xl">{children}</div>
            </main>
          </QueryProvider>
          <Toaster richColors />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
