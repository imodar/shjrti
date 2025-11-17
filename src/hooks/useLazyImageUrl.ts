import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Cache for signed URLs to avoid regenerating them
const urlCache = new Map<string, { url: string; expires: number }>();

export const useLazyImageUrl = (filePath: string | undefined, enabled: boolean = true) => {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!filePath || !enabled) return;

    const loadUrl = async () => {
      // Check cache first
      const cached = urlCache.get(filePath);
      if (cached && cached.expires > Date.now()) {
        setUrl(cached.url);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error: storageError } = await supabase.storage
          .from('family-memories')
          .createSignedUrl(filePath, 3600); // 1 hour

        if (storageError) throw storageError;

        if (data?.signedUrl) {
          setUrl(data.signedUrl);
          // Cache the URL (expires in 50 minutes to be safe)
          urlCache.set(filePath, {
            url: data.signedUrl,
            expires: Date.now() + 50 * 60 * 1000
          });
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error loading image URL:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUrl();
  }, [filePath, enabled]);

  return { url, isLoading, error };
};
