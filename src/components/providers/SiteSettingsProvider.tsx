'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

interface SiteSettings {
  siteName?: string | null;
  siteNameEn?: string | null;
  logoUrl?: string | null;
  logoUploadUrl?: string | null;
  brandColor?: string | null;
  faviconUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  addressZh?: string | null;
  footerTextZh?: string | null;
  footerTextEn?: string | null;
}

interface SiteSettingsContextValue {
  settings: SiteSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: null,
  loading: true,
  refresh: async () => {},
});

export function SiteSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/site-settings', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!res.ok) {
        console.warn('SiteSettings API returned non-OK status:', res.status);
        setSettings(null);
        return;
      }

      const data = await res.json();
      if (data?.success && data.data) {
        setSettings(data.data as SiteSettings);
      } else {
        setSettings(null);
      }
    } catch (e) {
      console.error('SiteSettings fetch error:', e);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SiteSettingsContext.Provider
      value={{ settings, loading, refresh: fetchSettings }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
