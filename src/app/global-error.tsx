'use client';

// Disable static generation to avoid SSR prerendering issues
export const dynamic = 'force-dynamic';

// Minimal global error handler without Context dependencies
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
        <h1>Something went wrong!</h1>
        <p>Please try refreshing the page.</p>
      </body>
    </html>
  );
}