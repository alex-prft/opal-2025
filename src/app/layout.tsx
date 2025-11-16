import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { GuardrailsProvider } from "@/lib/contexts/GuardrailsContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Optimizely Strategy Assistant",
  description: "AI-powered strategy assistant for Optimizely DXP customers. Get data-driven insights and personalized recommendations. Created by Perficient.",
  icons: [
    { url: '/images/gradient-orb.png', type: 'image/png' },
    { url: '/images/gradient-orb.png', type: 'image/png', sizes: '32x32' },
    { url: '/images/gradient-orb.png', type: 'image/png', sizes: '180x180', rel: 'apple-touch-icon' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          <GuardrailsProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </GuardrailsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
