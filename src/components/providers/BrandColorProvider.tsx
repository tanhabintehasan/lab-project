'use client';

import { useEffect } from 'react';
import { useSiteSettings } from './SiteSettingsProvider';

export function BrandColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    const brandColor = settings?.brandColor || '#0066B3';
    const root = document.documentElement;
    root.style.setProperty('--primary', brandColor);
    root.style.setProperty('--primary-foreground', '#ffffff');
  }, [settings?.brandColor]);

  return children;
}
