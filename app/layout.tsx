import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { headers } from "next/headers";
import PWARegister from "@/components/pwa-register";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "Salon Central — Salon Management",
    template: "%s | Salon Central",
  },
  description: "WhatsApp-native salon booking & client management platform",
  icons: {
    icon: [
      { url: "/salon-central-favicon.png", type: "image/png", sizes: "1254x1254" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  // PWA: makes the app installable and, on iOS, unlocks Web Push (which only
  // works once the site has been added to the Home Screen).
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Salon Central",
    statusBarStyle: "default",
  },
};

// viewportFit: "cover" lets content draw under the notch/home-indicator area on
// iOS so the env(safe-area-inset-*) values globals.css already reads (bottom nav,
// mobile app bar) actually resolve to something non-zero instead of silently no-op'ing.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Tints the Android task-switcher header and the standalone status bar to
  // match the manifest's theme_color.
  themeColor: "#7C3AED",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the nonce injected by middleware so Next.js can apply it to its
  // internal inline hydration scripts, satisfying the nonce-based CSP.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en">
      <head>
        {/* Propagate nonce so any manually-added scripts can use it */}
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body className={`${montserrat.className} ${montserrat.variable}`} suppressHydrationWarning>
        {/* Registers /sw.js once for the whole app (scope "/") — push + offline. */}
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
