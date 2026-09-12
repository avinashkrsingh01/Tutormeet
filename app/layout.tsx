import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { SITE_URL, OG_IMAGE_DEFAULT, websiteSchema, organizationSchema, jsonLd } from "@/lib/seo";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";

// ─── Root metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:  `${APP_NAME} — Find. Meet. Learn.`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,

  keywords: [
    "home tutor",
    "home tuition India",
    "private tutor",
    "verified tutor",
    "tutor marketplace India",
    "find tutor near me",
    "CBSE tutor",
    "ICSE tutor",
    "home tutor Gurugram",
    "home tutor Delhi",
    "home tutor Noida",
    "home tutor Bangalore",
  ],

  authors:   [{ name: APP_NAME, url: SITE_URL }],
  creator:   APP_NAME,
  publisher: APP_NAME,

  // Canonical is set per-page; root defaults to SITE_URL
  alternates: { canonical: SITE_URL },

  // Allow all crawlers unless a page overrides with noIndex
  robots: {
    index:     true,
    follow:    true,
    googleBot: {
      index:               true,
      follow:              true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },

  openGraph: {
    type:        "website",
    locale:      "en_IN",
    url:         SITE_URL,
    siteName:    APP_NAME,
    title:       `${APP_NAME} — Find. Meet. Learn.`,
    description: APP_DESCRIPTION,
    images:      [OG_IMAGE_DEFAULT],
  },

  twitter: {
    card:        "summary_large_image",
    site:        "@tutormeetin",
    creator:     "@tutormeetin",
    title:       `${APP_NAME} — Find. Meet. Learn.`,
    description: APP_DESCRIPTION,
    images:      [OG_IMAGE_DEFAULT.url],
  },

  // App icons — place actual files in /public/icons/
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png",  sizes: "16x16",  type: "image/png" },
      { url: "/icons/favicon-32x32.png",  sizes: "32x32",  type: "image/png" },
      { url: "/icons/favicon-96x96.png",  sizes: "96x96",  type: "image/png" },
    ],
    apple:    "/icons/apple-touch-icon.png",
    shortcut: "/icons/favicon.ico",
  },

  // Web app manifest
  manifest: "/site.webmanifest",

  // Verification tags — fill in once verified
  // verification: {
  //   google: "GOOGLE_SEARCH_CONSOLE_TOKEN",
  //   yandex: "YANDEX_TOKEN",
  // },
};

// ─── Viewport ──────────────────────────────────────────────────────────────────

export const viewport: Viewport = {
  themeColor:   [
    { media: "(prefers-color-scheme: light)", color: "#0d1e4a" },
    { media: "(prefers-color-scheme: dark)",  color: "#0d1e4a" },
  ],
  width:        "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Prevent font scaling on iOS when rotating
  viewportFit:  "cover",
};

// ─── Root layout ───────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Site-wide structured data — placed in <head> for crawlers */}
        <script key="ld-website"      {...jsonLd(websiteSchema())} />
        <script key="ld-organization" {...jsonLd(organizationSchema())} />
        {/* Preconnect to Google Fonts CDN for render performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
