import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "StackJob - Trade Job Management",
  description: "Manage contractor jobs from import to completion. Works for any trade: Electrician, Plumber, HVAC, Roofing, and more.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Providers>
          <Nav />
          <main>{children}</main>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
