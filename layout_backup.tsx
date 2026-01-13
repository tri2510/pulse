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
  title: "Pulse - Real-Time Insights",
  description: "Stay ahead with real-time news analysis powered by GDELT-inspired insights. Track trending stories, understand sentiment, and discover impactful events as they happen.",
  keywords: ["Pulse", "News", "Real-time", "Trending", "GDELT", "Sentiment", "Insights", "Analytics", "Breaking News", "Data-Driven"],
  authors: [{ name: "Pulse Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Pulse - Real-Time Insights",
    description: "Stay ahead with real-time news analysis powered by GDELT-inspired insights.",
    url: "https://chat.z.ai",
    siteName: "Pulse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse - Real-Time Insights",
    description: "Stay ahead with real-time news analysis powered by GDELT-inspired insights.",
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
