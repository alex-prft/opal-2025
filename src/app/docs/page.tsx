/**
 * API Documentation Page - Dynamic Wrapper
 *
 * This wrapper prevents static generation during build by using force-dynamic.
 * The actual component is loaded client-side only.
 */

// Force dynamic rendering to skip static generation
export const dynamic = 'force-dynamic';

export default function APIDocumentationPage() {
  // Return a placeholder that will be hydrated client-side
  // The client component is imported directly here for simplicity
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading API Documentation...</p>
        <noscript>
          <p className="mt-4 text-red-600">JavaScript is required to view the API documentation.</p>
        </noscript>
      </div>
    </div>
  );
}
