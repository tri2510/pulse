import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse - Real-Time News Intelligence",
  description: "Stay ahead with real-time news analysis powered by GDELT-inspired analytics. Track trending stories, understand impact scores, and discover breaking news as it happens.",
  keywords: ["Pulse", "News", "Real-time", "Trending", "GDELT", "Analytics", "Breaking News", "Data-Driven", "News Intelligence"],
  authors: [{ name: "Pulse" }],
  openGraph: {
    title: "Pulse - Real-Time News Intelligence",
    description: "Stay ahead with real-time news analysis powered by GDELT-inspired analytics.",
    siteName: "Pulse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse - Real-Time News Intelligence",
    description: "Stay ahead with real-time news analysis powered by GDELT-inspired analytics.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
