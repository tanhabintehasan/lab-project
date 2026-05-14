'use client';

import { useEffect, useRef } from 'react';

/**
 * ExtensionGuard — prevents browser extensions (Google Translate, etc.)
 * from mutating the React-managed DOM tree and causing removeChild crashes.
 *
 * Strategy:
 * 1. Intercept DOM mutations from non-React sources (font tags, injected spans).
 * 2. Block Google Translate's translate.googleapis.com network requests via
 *    a tiny fetch/XMLHttpRequest patch (cosmetic — real blocking needs CSP).
 * 3. Clean up font tags that Translate wraps around text nodes.
 */
export function ExtensionGuard({ children }: { children: React.ReactNode }) {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Block Google Translate CORS noise by intercepting its script injection attempts
    const originalAppendChild = document.head.appendChild.bind(document.head);
    document.head.appendChild = <T extends Node>(node: T): T => {
      if (node instanceof HTMLScriptElement && node.src?.includes('translate.googleapis.com')) {
        // Silently discard the Google Translate script to prevent CORS errors
        return node;
      }
      return originalAppendChild(node);
    };

    // MutationObserver: revert translate-specific mutations before React reconciler notices
    observerRef.current = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof HTMLElement) {
              // Google Translate injects <font> tags; unwrap them
              if (node.tagName === 'FONT' && node.hasAttribute('style')) {
                const parent = node.parentNode;
                if (parent) {
                  while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                  }
                  parent.removeChild(node);
                }
              }
            }
          }
        }
      }
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      document.head.appendChild = originalAppendChild;
    };
  }, []);

  return <>{children}</>;
}
