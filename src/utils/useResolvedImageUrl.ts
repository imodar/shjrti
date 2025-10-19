import { useState, useEffect } from 'react';
import { getMemberImageUrl } from './imageUpload';

// In-memory cache for signed URLs (1 hour expiration)
const urlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Hook to resolve member images to signed URLs
 * Handles Base64 data URIs, blob URLs, HTTP URLs, and storage paths
 * @param imagePath - The image path or URL to resolve
 * @param lazy - If true, delays resolution by 100ms for progressive loading
 */
export const useResolvedImageUrl = (
  imagePath: string | null | undefined,
  lazy: boolean = false
): string | null => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState(!lazy);

  // Delay fetching if lazy loading is enabled
  useEffect(() => {
    if (lazy) {
      const timer = setTimeout(() => setShouldFetch(true), 100);
      return () => clearTimeout(timer);
    }
  }, [lazy]);

  useEffect(() => {
    if (!shouldFetch) return;

    const resolveUrl = async () => {
      if (!imagePath) {
        setResolvedUrl(null);
        return;
      }

      // If it's already a data URI, blob URL, or HTTP URL, use as-is
      if (
        imagePath.startsWith('data:image/') ||
        imagePath.startsWith('blob:') ||
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
      ) {
        setResolvedUrl(imagePath);
        return;
      }

      // Check cache first
      const cached = urlCache.get(imagePath);
      if (cached && cached.expiresAt > Date.now()) {
        setResolvedUrl(cached.url);
        return;
      }

      // It's a storage path, fetch signed URL
      try {
        const signedUrl = await getMemberImageUrl(imagePath);
        if (signedUrl) {
          // Cache for 1 hour (3600000ms)
          urlCache.set(imagePath, {
            url: signedUrl,
            expiresAt: Date.now() + 3600000
          });
          setResolvedUrl(signedUrl);
        } else {
          setResolvedUrl(null);
        }
      } catch (error) {
        console.error('Failed to resolve image URL:', error);
        setResolvedUrl(null);
      }
    };

    resolveUrl();
  }, [imagePath, shouldFetch]);

  return resolvedUrl;
};
