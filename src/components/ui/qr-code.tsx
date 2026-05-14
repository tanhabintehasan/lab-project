'use client';

import { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';
import { cn } from '@/lib/utils';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 128, className }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    toDataURL(value, { width: size, margin: 2, errorCorrectionLevel: 'M' })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={cn('bg-gray-100 animate-pulse rounded', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`QR code for ${value}`}
      className={cn('rounded', className)}
      style={{ width: size, height: size }}
    />
  );
}
