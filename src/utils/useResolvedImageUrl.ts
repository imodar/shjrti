import { useState, useEffect } from 'react';
import { getMemberImageUrl } from './imageUpload';

/**
 * Hook to resolve member images to signed URLs
 * Handles Base64 data URIs, blob URLs, HTTP URLs, and storage paths
 */
export const useResolvedImageUrl = (imagePath: string | null | undefined): string | null => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
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

      // It's a storage path, fetch signed URL
      try {
        const signedUrl = await getMemberImageUrl(imagePath);
        setResolvedUrl(signedUrl);
      } catch (error) {
        console.error('Failed to resolve image URL:', error);
        setResolvedUrl(null);
      }
    };

    resolveUrl();
  }, [imagePath]);

  return resolvedUrl;
};
