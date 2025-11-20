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
              {/*
                CRITICAL: Context Provider Hierarchy & Static Generation Safety

                The useContext error during global error prerendering is a Next.js 16 + React 19
                issue, not caused by our providers. Each provider implements React Hook Safety patterns.

                - QueryProvider: Handles React Query setup with useState safety check
                - GuardrailsProvider: Manages security context with useContext safety
                - AuthProvider: Handles authentication state with hook safety

                If you add new providers here, ensure they follow the pattern in:
                docs/react-hook-static-generation-troubleshooting.md
              */}
              {children}
            </AuthProvider>
          </GuardrailsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
