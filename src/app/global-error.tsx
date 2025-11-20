'use client';

// CRITICAL: Custom global error handler to prevent Next.js 16 build failures
// This overrides Next.js default global-error page
// Must have 'use client' but needs comprehensive React hook safety guards

import * as React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // CRITICAL: During static generation, React context system may be null
  // Check both window and React availability before proceeding
  const isStaticGeneration = typeof window === 'undefined' && (!React || !(React as any).useState);

  if (isStaticGeneration) {
    // Static generation mode - return minimal HTML without any React hooks
    return (
      <html>
        <body>
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fef2f2',
            fontFamily: 'system-ui, sans-serif',
            padding: '16px'
          }}>
            <div style={{
              maxWidth: '448px',
              width: '100%',
              textAlign: 'center',
              padding: '32px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h1 style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                color: '#dc2626',
                margin: '0 0 16px 0'
              }}>
                ⚠️
              </h1>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 16px 0'
              }}>
                Something Went Wrong
              </h2>
              <p style={{
                color: '#6b7280',
                margin: '0 0 32px 0',
                lineHeight: '1.5'
              }}>
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              <a
                href="/"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </body>
      </html>
    );
  }
  // Pure static JSX - works during both static generation and runtime
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fef2f2',
          fontFamily: 'system-ui, sans-serif',
          padding: '16px'
        }}>
          <div style={{
            maxWidth: '448px',
            width: '100%',
            textAlign: 'center',
            padding: '32px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h1 style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#dc2626',
              margin: '0 0 16px 0'
            }}>
              ⚠️
            </h1>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 16px 0'
            }}>
              Something Went Wrong
            </h2>
            <p style={{
              color: '#6b7280',
              margin: '0 0 32px 0',
              lineHeight: '1.5'
            }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                marginRight: '8px'
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
