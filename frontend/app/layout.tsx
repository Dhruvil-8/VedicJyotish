import type { Metadata, Viewport } from "next";
import { Cinzel, Libre_Baskerville } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vedic-jyotish.vercel.app"),
  title: "Vedic Jyotish | Ancient Wisdom, Modern Insight",
  description: "Personalized Vedic Jyotish analysis powered by AI and precise astronomical calculations. Rooted in the deep traditions of Sanatan Dharma.",
  keywords: [
    "Vedic astrology",
    "Kundli",
    "Jyotish",
    "birth chart analysis",
    "Sanatan Dharma astrology",
    "Hindu astrology",
    "online Kundali",
    "AI astrologer",
    "Navagraha",
    "karmic map"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Vedic Jyotish | AI-Powered Birth Chart Analysis",
    description: "Discover your karmic path with precise astronomical calculations and AI analysis based on ancient Vedic astrology (Jyotisha) traditions.",
    url: "https://vedic-jyotish.vercel.app",
    siteName: "Vedic Jyotish",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vedic Jyotish | AI Astrologer",
    description: "Vedic astrological analysis powered by high-precision ephemeris and artificial intelligence.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VedicAstro",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#d4a017",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cinzel.variable} ${libreBaskerville.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
