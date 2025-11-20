import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLazyImageUrl = (filePath: string | undefined, enabled: boolean = true) => {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!filePath || !enabled) return;

    const loadUrl = () => {
      setIsLoading(true);
      try {
        const { data } = supabase.storage
          .from('family-memories')
          .getPublicUrl(filePath);

        setUrl(data.publicUrl);
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
