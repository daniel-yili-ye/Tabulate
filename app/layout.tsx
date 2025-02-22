import "@/app/globals.css";
import { Inter as FontSans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/utils/utils";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
