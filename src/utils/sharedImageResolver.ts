import { supabase } from '@/integrations/supabase/client';
import { getPublicShareContext } from './publicShareContext';

type Bucket = 'member-memories' | 'family-memories';

const cache = new Map<string, { url: string; expiresAt: number }>();

const cacheKey = (bucket: Bucket, path: string, ctxKey: string) =>
  `${ctxKey}::${bucket}::${path}`;

/**
 * Resolve a storage path to a signed URL using the active public-share
 * context (share_token or custom_domain). Returns null when no context is
 * available or the request fails.
 */
export async function resolveSharedImageUrl(
  bucket: Bucket,
  filePath: string
): Promise<string | null> {
  const ctx = getPublicShareContext();
  if (!ctx || (!ctx.shareToken && !ctx.customDomain)) return null;

  const ctxKey = ctx.shareToken ? `t:${ctx.shareToken}` : `d:${ctx.customDomain}`;
  const key = cacheKey(bucket, filePath, ctxKey);

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  try {
    const { data, error } = await supabase.functions.invoke('get-shared-image', {
      body: {
        bucket,
        file_path: filePath,
        share_token: ctx.shareToken,
        custom_domain: ctx.customDomain,
        password: ctx.password,
      },
    });

    if (error || !data?.signedUrl) {
      console.warn('[sharedImageResolver] failed', { bucket, filePath, error, data });
      return null;
    }

    cache.set(key, {
      url: data.signedUrl,
      // refresh slightly before backend expiry
      expiresAt: Date.now() + Math.max(60_000, (data.expiresIn ?? 3600) * 1000 - 60_000),
    });
    return data.signedUrl as string;
  } catch (e) {
    console.warn('[sharedImageResolver] threw', e);
    return null;
  }
}