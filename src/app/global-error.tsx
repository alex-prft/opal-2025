'use client';

/**
 * Global Error Handler for Next.js 16.0.1
 *
 * CRITICAL WORKAROUND: This file prevents Next.js build-time prerendering errors
 * caused by React 19 + Next.js 16 compatibility issues with internal global-error page.
 *
 * The error occurs during static generation when Next.js tries to prerender /_global-error
 * and encounters "Cannot read properties of null (reading 'useContext')".
 *
 * This custom implementation:
 * 1. Uses 'use client' to prevent server-side rendering
 * 2. Uses force-dynamic to skip static generation entirely
 * 3. Provides minimal HTML-only error UI without React hooks or context
 */

// CRITICAL: Force dynamic rendering to prevent static generation errors
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, sans-serif',
          padding: '16px'
        }}>
          <div style={{
            maxWidth: '448px',
            width: '100%',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: '#dc2626',
              margin: '0 0 16px 0'
            }}>
              Error
            </h1>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: '0 0 16px 0'
            }}>
              Something went wrong!
            </h2>
            <p style={{
              color: '#6b7280',
              margin: '0 0 32px 0',
              lineHeight: '1.5'
            }}>
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            <button
              onClick={() => reset()}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                marginRight: '8px'
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#6b7280',
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
