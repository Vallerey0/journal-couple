import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://journalcouple.com"),

  title: {
    template: "%s | Journal Couple",
    default: "Journal Couple",
  },

  description:
    "Private couple journal untuk menyimpan kenangan, foto, perjalanan, dan cerita bersama pasangan.",

  applicationName: "Journal Couple",
  authors: [{ name: "Journal Couple", url: "https://journalcouple.com" }],
  creator: "Journal Couple",
  publisher: "Journal Couple",
  category: "Lifestyle",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    title: "Journal Couple",
    description: "Private couple journal untuk menyimpan kenangan pasangan.",
    url: "https://journalcouple.com",
    siteName: "Journal Couple",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "id_ID",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Journal Couple",
    description: "Private couple journal untuk menyimpan kenangan pasangan.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://journalcouple.com/#organization",
        name: "Journal Couple",
        url: "https://journalcouple.com",
        logo: {
          "@type": "ImageObject",
          url: "https://journalcouple.com/logo.png",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://journalcouple.com/#website",
        url: "https://journalcouple.com",
        name: "Journal Couple",
        description:
          "Private couple journal untuk menyimpan kenangan, foto, perjalanan, dan cerita bersama pasangan.",
        publisher: { "@id": "https://journalcouple.com/#organization" },
      },
    ],
  };

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
