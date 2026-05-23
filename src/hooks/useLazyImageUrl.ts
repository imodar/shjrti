import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasPublicShareContext } from '@/utils/publicShareContext';
import { resolveSharedImageUrl } from '@/utils/sharedImageResolver';

export const useLazyImageUrl = (filePath: string | undefined, enabled: boolean = true) => {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!filePath || !enabled) return;

    let cancelled = false;
    const loadUrl = async () => {
      setIsLoading(true);
      try {
        if (hasPublicShareContext()) {
          const signed = await resolveSharedImageUrl('family-memories', filePath);
          if (!cancelled) setUrl(signed);
        } else {
          const { data, error: signError } = await supabase.storage
            .from('family-memories')
            .createSignedUrl(filePath, 3600);
          if (signError) throw signError;
          if (!cancelled) setUrl(data?.signedUrl ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err as Error);
        console.error('Error loading image URL:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadUrl();
    return () => {
      cancelled = true;
    };
  }, [filePath, enabled]);

  return { url, isLoading, error };
};
