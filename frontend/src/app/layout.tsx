import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E_Chat | Modern Real-time Messaging",
  description: "A modern, secure chat application with real-time messaging, file sharing, and voice messages. Built with Next.js and FastAPI.",
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-512.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider defaultTheme="dark" storageKey="echat-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
