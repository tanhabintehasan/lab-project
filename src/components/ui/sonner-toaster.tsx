'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

export function SonnerToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Toaster position="top-center" richColors />;
}
