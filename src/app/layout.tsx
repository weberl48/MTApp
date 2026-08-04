import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import {
  EB_Garamond,
  Geist,
  Geist_Mono,
  Lora,
  Nunito,
  Quicksand,
  Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import { NON_DEFAULT_THEME_IDS, THEME_STORAGE_KEY } from "@/lib/themes";
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

// Theme fonts (see src/app/themes.css). Declaring them all is cheap: the
// browser only downloads a font file when rendered text actually uses it,
// so only the active theme's font ever transfers.
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const sourceSans = Source_Sans_3({ variable: "--font-source-sans", subsets: ["latin"] });
const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
const ebGaramond = EB_Garamond({ variable: "--font-eb-garamond", subsets: ["latin"] });

const themeFontVariables = [
  nunito.variable,
  sourceSans.variable,
  quicksand.variable,
  lora.variable,
  ebGaramond.variable,
].join(" ");

// Stamps data-theme on <html> before first paint so there is no flash of the
// default theme — same trick next-themes uses for dark mode. Portal routes
// are excluded: clients see org branding, never a staff member's theme.
const themeScript = `try{if(!location.pathname.startsWith('/portal')){var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t&&${JSON.stringify(NON_DEFAULT_THEME_IDS)}.indexOf(t)>-1)document.documentElement.setAttribute('data-theme',t)}}catch(e){}`;

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
    // Font variable classes live on <html>, not <body>: themes.css resolves
    // var(--font-nunito) etc. inside html[data-theme] blocks, and an
    // unregistered custom property substitutes var() on the element where it
    // is DECLARED — declared on html, the font vars must exist there too.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${themeFontVariables}`}
    >
      <body className="antialiased">
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
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
