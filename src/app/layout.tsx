import type { Metadata } from "next";
import { Inter, Rokkitt, Rye, Alfa_Slab_One, Lobster, Fraunces } from "next/font/google";
import "./globals.css";
import GlobalNav from "@/components/GlobalNav";
import MobileNav from "@/components/MobileNav";
import AuthCookieSetter from "@/components/AuthCookieSetter";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const rokkitt = Rokkitt({
  variable: "--font-rokkitt",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const rye = Rye({
  variable: "--font-rye",
  subsets: ["latin"],
  weight: ["400"],
});

const alfaSlabOne = Alfa_Slab_One({
  variable: "--font-alfa",
  subsets: ["latin"],
  weight: ["400"],
});

const lobster = Lobster({
  variable: "--font-lobster",
  subsets: ["latin"],
  weight: ["400"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["800", "900"],
});

export const metadata: Metadata = {
  title: "Giddy List | Gifts that make them giddy",
  description: "Create wishlists and registries for your kids, or curate gift guides and earn money. Gifts for kids 0-18.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo-g-bow-red.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
      { url: "/logo-g-bow-red.png", type: "image/png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "Giddy List | Gifts that make them giddy",
    description: "Create wishlists and registries for your kids, or curate gift guides and earn money. Gifts for kids 0-18.",
    url: "https://thegiddylist.com",
    siteName: "Giddy List",
    images: [
      {
        url: "https://thegiddylist.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Giddy List - Gifts that make them giddy.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Giddy List | Gifts that make them giddy",
    description: "Create wishlists and registries for your kids, or curate gift guides and earn money. Gifts for kids 0-18.",
    images: ["https://thegiddylist.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${rokkitt.variable} ${rye.variable} ${alfaSlabOne.variable} ${lobster.variable} ${fraunces.variable} antialiased bg-cream`}
      >
        <AuthCookieSetter />
        <GlobalNav />
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
