'use client';

import * as React from 'react';
import { useEffect } from 'react';

/**
 * Error Boundary Component for Next.js App Router
 *
 * This component handles errors within the app directory (below the root layout).
 * It works alongside global-error.tsx which handles root layout errors.
 *
 * CRITICAL: Both error.tsx and global-error.tsx are required for Next.js 15+
 * to properly initialize error boundaries during development and production.
 */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // CRITICAL: React hook safety check during static generation
  // Although this is a client component, Next.js may attempt static generation
  if (typeof window === 'undefined' && (!React || !useEffect)) {
    return (
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
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#dc2626',
            margin: '0 0 16px 0'
          }}>
            Error
          </h1>
          <p style={{
            color: '#6b7280',
            margin: '0 0 16px 0'
          }}>
            Something went wrong
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
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
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#dc2626',
          margin: '0 0 16px 0'
        }}>
          Oops!
        </h1>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: '0 0 16px 0'
        }}>
          Something went wrong
        </h2>
        <p style={{
          color: '#6b7280',
          margin: '0 0 24px 0',
          lineHeight: '1.5'
        }}>
          We encountered an unexpected error. Please try again or return home.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            backgroundColor: '#fee2e2',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: '#991b1b',
              margin: 0,
              wordBreak: 'break-word'
            }}>
              {error.message}
            </p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '1rem'
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
              fontWeight: '500',
              fontSize: '1rem'
            }}
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
