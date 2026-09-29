import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationProvider } from "@/components/navigation-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { SiteLoadProgress } from "@/components/site-load-progress";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

const themeScript = `(() => {
  try {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
  } catch {}
})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <QueryProvider>
          <NavigationProvider>
            <SiteLoadProgress />
            {children}
          </NavigationProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
