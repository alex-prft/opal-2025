/**
 * Ask Assistant Wrapper Component
 *
 * Provides Ask Assistant context to Results pages based on URL parameters
 * and page context. Automatically detects section keys and source paths.
 */

'use client';

import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { AskAssistantProvider } from '@/lib/askAssistant/context';
import { getResultsSectionKey, getSourcePath, shouldShowAskAssistant } from '@/lib/askAssistant/sectionMapping';

export interface AskAssistantWrapperProps {
  children: React.ReactNode;
  /** Override automatic section key detection */
  sectionKey?: string;
  /** Override automatic source path detection */
  sourcePath?: string;
  /** Force enable/disable Ask Assistant */
  forceEnabled?: boolean;
}

export function AskAssistantWrapper({
  children,
  sectionKey: overrideSectionKey,
  sourcePath: overrideSourcePath,
  forceEnabled
}: AskAssistantWrapperProps) {
  const params = useParams();
  const pathname = usePathname();

  // Extract parameters safely
  const tier1 = typeof params.tier1 === 'string' ? decodeURIComponent(params.tier1) : undefined;
  const tier2 = typeof params.tier2 === 'string' ? decodeURIComponent(params.tier2) : undefined;
  const tier3 = typeof params.tier3 === 'string' ? decodeURIComponent(params.tier3) : undefined;

  // Determine section key
  let sectionKey = overrideSectionKey || getResultsSectionKey(tier1, tier2, tier3, pathname);

  // Determine source path
  let sourcePath = overrideSourcePath || getSourcePath(tier1, tier2, tier3, pathname);

  // Check if Ask Assistant should be shown
  const shouldShow = forceEnabled !== undefined ? forceEnabled : shouldShowAskAssistant(sectionKey, pathname);

  // If Ask Assistant shouldn't be shown, render children without context
  if (!shouldShow || !sectionKey) {
    return <>{children}</>;
  }

  return (
    <AskAssistantProvider
      sectionKey={sectionKey}
      sourcePath={sourcePath}
    >
      {children}
    </AskAssistantProvider>
  );
}

/**
 * Higher-order component version for easier integration
 */
export function withAskAssistant<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    sectionKey?: string;
    sourcePath?: string;
    forceEnabled?: boolean;
  }
) {
  const WrappedComponent = (props: P) => {
    return (
      <AskAssistantWrapper
        sectionKey={options?.sectionKey}
        sourcePath={options?.sourcePath}
        forceEnabled={options?.forceEnabled}
      >
        <Component {...props} />
      </AskAssistantWrapper>
    );
  };

  WrappedComponent.displayName = `withAskAssistant(${Component.displayName || Component.name})`;
  return WrappedComponent;
}