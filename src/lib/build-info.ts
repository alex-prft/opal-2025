// This file contains build-time information
// The build timestamp is set when the application is built

export const BUILD_INFO = {
  // Use environment variable for build time, fallback to a static value
  BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME || '2025-01-01T00:00:00.000Z',

  // Environment information
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Version information (you can update this manually or from package.json)
  VERSION: '1.0.0',

  // Git commit hash (if available from environment)
  COMMIT_HASH: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',

  // Deployment URL
  DEPLOYMENT_URL: process.env.VERCEL_URL || 'localhost'
} as const;

// Helper function to format the build time for display
export function formatBuildTime(): string {
  return new Date(BUILD_INFO.BUILD_TIME).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

// Helper function to get deployment info
export function getDeploymentInfo() {
  return {
    buildTime: formatBuildTime(),
    version: BUILD_INFO.VERSION,
    commit: BUILD_INFO.COMMIT_HASH,
    environment: BUILD_INFO.NODE_ENV
  };
}