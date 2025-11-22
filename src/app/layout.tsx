import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { GuardrailsProvider } from "@/lib/contexts/GuardrailsContext";
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
        {/* Simple worktree indicator script for development */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  const hostname = window.location.hostname;
                  if (hostname === 'localhost' || hostname === '192.168.1.64') {
                    const indicator = document.createElement('div');
                    indicator.textContent = 'review';
                    indicator.style.cssText = 'position:fixed;top:8px;left:8px;z-index:9999;background:rgba(0,0,0,0.8);color:white;font-size:12px;font-family:monospace;padding:4px 8px;border-radius:4px;backdrop-filter:blur(4px);';
                    document.body.appendChild(indicator);
                  }
                }
              })();
            `
          }}
        />
        <SafeProviderWrapper>
          <GuardrailsProvider>
            <AuthProvider>
              {/*
                CRITICAL: Context Provider Hierarchy & Static Generation Safety

                SafeProviderWrapper: Outermost wrapper that prevents ALL provider execution
                during Next.js 16 global-error static generation. This prevents the
                "Cannot read properties of null (reading 'useContext')" build failure.

                - SafeProviderWrapper: Checks React availability before rendering any providers
                - GuardrailsProvider: Manages security context with useContext safety
                - AuthProvider: Handles authentication state with hook safety

                If you add new providers here, ensure they follow the pattern in:
                docs/react-hook-static-generation-troubleshooting.md
              */}
              {children}
            </AuthProvider>
          </GuardrailsProvider>
        </SafeProviderWrapper>
      </body>
    </html>
  );
}
