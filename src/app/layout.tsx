import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { GuardrailsProvider } from "@/lib/contexts/GuardrailsContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Optimizely Strategy Assistant",
  description: "AI-powered strategy assistant for Optimizely DXP customers. Get data-driven insights and personalized recommendations. Created by Perficient.",
  icons: {
    icon: '/images/gradient-orb.png',
    shortcut: '/images/gradient-orb.png',
    apple: '/images/gradient-orb.png',
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
        className="antialiased"
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
