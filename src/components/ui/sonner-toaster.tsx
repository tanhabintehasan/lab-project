'use client';

import { Toaster } from 'sonner';

/**
 * Sonner Toaster — reconciliation-safe wrapper.
 *
 * Sonner's <Toaster> already handles SSR internally (it defers portal
 * creation to the client). We do NOT use a mount-guard here because
 * swapping element types (<div> → <Toaster>) after hydration creates
 * an unstable DOM mutation that can race with concurrent React updates.
 *
 * By rendering <Toaster> unconditionally, React sees the same element
 * type across SSR → hydration → client renders. Sonner manages its own
 * client-only portal lifecycle inside the component.
 */
export function SonnerToaster() {
  return <Toaster position="top-center" richColors />;
}
