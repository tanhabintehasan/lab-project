'use client';

import { useState, useEffect } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const FALLBACK_IMAGE = '/uploads/settings/logo.png';

export function SafeImage({ src, alt, fill, width, height, className, priority, sizes }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setImgSrc(src);
  }, [src]);

  const handleError = () => {
    if (isClient && imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  const style = fill
    ? ({ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as const)
    : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width={fill ? undefined : width || 640}
      height={fill ? undefined : height || 400}
      className={className}
      style={style}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      onError={handleError}
    />
  );
}
