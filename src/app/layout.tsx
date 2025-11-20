import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { GuardrailsProvider } from "@/lib/contexts/GuardrailsContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { SafeProviderWrapper } from "@/lib/providers/SafeProviderWrapper";

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
        <SafeProviderWrapper>
          <QueryProvider>
            <GuardrailsProvider>
              <AuthProvider>
                {/*
                  CRITICAL: Context Provider Hierarchy & Static Generation Safety

                  SafeProviderWrapper: Outermost wrapper that prevents ALL provider execution
                  during Next.js 16 global-error static generation. This prevents the
                  "Cannot read properties of null (reading 'useContext')" build failure.

                  - SafeProviderWrapper: Checks React availability before rendering any providers
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
        </SafeProviderWrapper>
      </body>
    </html>
  );
}
