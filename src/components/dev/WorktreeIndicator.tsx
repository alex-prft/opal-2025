'use client';

import React, { useState, useEffect } from 'react';

export function WorktreeIndicator() {
  /**
   * REACT HOOK SAFETY PATTERN - CRITICAL FIX
   *
   * Problem: Next.js 16 + React 19 global-error prerendering calls useState before React is initialized,
   * causing "Cannot read properties of null (reading 'useContext')" build failures.
   *
   * Solution: Check React availability before calling any hooks
   * - During static generation OR when React is null: Return nothing
   * - During runtime with React available: Normal hook behavior
   */

  // CRITICAL: Check if React hooks are available before using them
  // During Next.js 16 global-error prerendering, React can be null
  if (typeof window === 'undefined' && (!React || !(React as any).useState)) {
    // React is not initialized - return nothing during static generation
    return null;
  }

  const [shouldShow, setShouldShow] = useState(false);
  const [worktree, setWorktree] = useState('');

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const isDevelopment = hostname === 'localhost' || hostname === '192.168.1.64';

    if (isDevelopment) {
      // Extract worktree name from current directory context
      // Since we're in my-nextjs-app-review, the worktree is "review"
      const currentWorktree = 'review';
      setWorktree(currentWorktree);
      setShouldShow(true);
    }
  }, []);

  if (!shouldShow) return null;

  return (
    <div className="fixed top-2 left-2 z-50 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono backdrop-blur-sm">
      {worktree}
    </div>
  );
}