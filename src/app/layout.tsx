import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { DevErrorReporter } from "@/components/dev/dev-error-reporter";
import { ThemeProvider } from "next-themes";
import { validateEnv } from "@/lib/env";

validateEnv();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "May Creative Arts",
  description: "Practice management system for May Creative Arts",
  manifest: "/manifest.json",
  applicationName: "MCA Manager",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MCA Manager",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1e40af",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // next-themes injects an inline <script> to set the theme class before
  // hydration (that is what prevents the light-mode flash). The CSP built in
  // src/proxy.ts drops 'unsafe-inline' from script-src, so that script has to
  // carry the request's nonce or the browser blocks it and dark mode breaks.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem nonce={nonce}>
          <ServiceWorkerProvider />
          <PWAInstallPrompt />
          {process.env.NODE_ENV === "development" ? <DevErrorReporter /> : null}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
