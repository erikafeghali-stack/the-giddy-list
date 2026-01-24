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
  title: "The Giddy List",
  description: "Gifts that make them giddy.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "The Giddy List",
    description: "Gifts that make them giddy.",
    url: "https://thegiddylist.com",
    siteName: "The Giddy List",
    images: [
      {
        url: "https://thegiddylist.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Giddy List - Gifts that make them giddy.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Giddy List",
    description: "Gifts that make them giddy.",
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
