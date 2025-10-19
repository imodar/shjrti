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
  const [attempt, setAttempt] = useState(0);

  // Delay fetching if lazy loading is enabled
  useEffect(() => {
    if (lazy) {
      const timer = setTimeout(() => setShouldFetch(true), 100);
      return () => clearTimeout(timer);
    }
  }, [lazy]);

  // Reset retry attempts when image path changes
  useEffect(() => {
    setAttempt(0);
  }, [imagePath]);

  useEffect(() => {
    if (!shouldFetch) return;

    let isCancelled = false;
    let retryTimer: number | undefined;

    const resolveUrl = async () => {
      if (!imagePath) {
        if (!isCancelled) setResolvedUrl(null);
        return;
      }

      // Handle known URL types and Supabase storage URLs
      const isHttp = imagePath.startsWith('http://') || imagePath.startsWith('https://');
      const isSupabaseStorageHttp = isHttp && imagePath.includes('/storage/v1/object/') && imagePath.includes('member-memories');

      // Data URIs and blobs: use as-is
      if (imagePath.startsWith('data:image/') || imagePath.startsWith('blob:')) {
        if (!isCancelled) setResolvedUrl(imagePath);
        return;
      }

      // Non-Supabase HTTP URLs: use as-is
      if (isHttp && !isSupabaseStorageHttp) {
        if (!isCancelled) setResolvedUrl(imagePath);
        return;
      }

      // Normalize storage path (handles raw paths and supabase storage URLs)
      let normalizedPath = imagePath.replace(/^\/+/, '');
      const bucketMarker = 'member-memories/';
      const markerIndex = normalizedPath.indexOf(bucketMarker);
      if (markerIndex !== -1) {
        normalizedPath = normalizedPath.substring(markerIndex + bucketMarker.length);
      }

      // Check cache first
      const cached = urlCache.get(normalizedPath);
      if (cached && cached.expiresAt > Date.now()) {
        if (!isCancelled) setResolvedUrl(cached.url);
        return;
      }

      // It's a storage path, fetch signed URL
      try {
        const signedUrl = await getMemberImageUrl(normalizedPath);
        if (signedUrl) {
          // Cache for 1 hour (3600000ms)
          urlCache.set(normalizedPath, {
            url: signedUrl,
            expiresAt: Date.now() + 3600000
          });
          if (!isCancelled) setResolvedUrl(signedUrl);
        } else {
          if (attempt < 3) {
            const delay = 500 * Math.pow(2, attempt);
            retryTimer = window.setTimeout(() => setAttempt((a) => a + 1), delay);
          } else {
            if (!isCancelled) setResolvedUrl(null);
          }
        }
      } catch (error) {
        console.error('Failed to resolve image URL:', error);
        if (attempt < 3) {
          const delay = 500 * Math.pow(2, attempt);
          retryTimer = window.setTimeout(() => setAttempt((a) => a + 1), delay);
        } else {
          if (!isCancelled) setResolvedUrl(null);
        }
      }
    };

    resolveUrl();

    return () => {
      isCancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [imagePath, shouldFetch, attempt]);

  return resolvedUrl;
};
