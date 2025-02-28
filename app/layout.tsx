import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/utils/utils";

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
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
        suppressHydrationWarning={true}
      >
        <main className="container">
          <header className="py-4 sticky top-0 z-50 w-full bg-background m-auto md:max-w-xl">
            <h1 className="text-2xl font-bold">Tabulate</h1>
          </header>
          <div className="py-4 m-auto md:max-w-xl">{children}</div>
        </main>
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}
