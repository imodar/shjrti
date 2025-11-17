import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLazyImageUrl } from '@/hooks/useLazyImageUrl';

interface LazyMemoryImageProps {
  filePath: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}

export const LazyMemoryImage: React.FC<LazyMemoryImageProps> = ({
  filePath,
  alt,
  className = '',
  onLoad
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const { url, isLoading } = useLazyImageUrl(filePath, isVisible);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px' // Start loading 100px before image comes into view
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isLoading || !url ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <img
          src={url}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={onLoad}
        />
      )}
    </div>
  );
};
