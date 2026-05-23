import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Body = {
  bucket: 'member-memories' | 'family-memories';
  file_path: string;
  share_token?: string;
  custom_domain?: string;
  password?: string;
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = (await req.json()) as Body;
    const { bucket, file_path, share_token, custom_domain, password } = body || ({} as Body);

    if (!bucket || !file_path) return json(400, { error: 'bucket and file_path required' });
    if (!['member-memories', 'family-memories'].includes(bucket)) {
      return json(400, { error: 'invalid bucket' });
    }
    if (!share_token && !custom_domain) {
      return json(400, { error: 'share_token or custom_domain required' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Resolve family by token or custom domain
    let familyQuery = admin
      .from('families')
      .select('id, share_token, share_token_expires_at, share_password_hash, custom_domain')
      .limit(1);

    if (share_token) {
      familyQuery = familyQuery.eq('share_token', share_token);
    } else {
      familyQuery = familyQuery.eq('custom_domain', (custom_domain || '').toLowerCase());
    }

    const { data: family, error: famErr } = await familyQuery.maybeSingle();
    if (famErr || !family) return json(404, { error: 'family not found' });

    // Validate share_token expiry
    if (share_token) {
      const expiresAt = family.share_token_expires_at ? new Date(family.share_token_expires_at) : null;
      if (!expiresAt || expiresAt < new Date()) return json(403, { error: 'token expired' });
    }

    // Password gate (if family has one)
    if (family.share_password_hash) {
      if (!password) return json(403, { error: 'PASSWORD_REQUIRED' });
      const { data: ok, error: pwErr } = await admin.rpc('verify_share_password', {
        plain_password: password,
        hashed_password: family.share_password_hash,
      });
      if (pwErr || !ok) return json(403, { error: 'PASSWORD_INCORRECT' });
    }

    // Normalize path (strip bucket prefix / leading slashes)
    let path = file_path.replace(/^\/+/, '');
    const marker = `${bucket}/`;
    const mi = path.indexOf(marker);
    if (mi !== -1) path = path.substring(mi + marker.length);

    // Validate path belongs to this family
    if (bucket === 'family-memories') {
      // Expected: {family_id}/...
      const firstSeg = path.split('/')[0];
      if (firstSeg !== family.id) return json(403, { error: 'path/family mismatch' });
    } else {
      // member-memories: {member_id}/... -> verify member belongs to family
      const memberId = path.split('/')[0];
      if (!memberId) return json(400, { error: 'invalid path' });
      const { data: member, error: mErr } = await admin
        .from('family_tree_members')
        .select('id, family_id')
        .eq('id', memberId)
        .maybeSingle();
      if (mErr || !member || member.family_id !== family.id) {
        return json(403, { error: 'member not in family' });
      }
    }

    // Sign URL (1h)
    const { data: signed, error: sErr } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    if (sErr || !signed?.signedUrl) {
      console.error('[get-shared-image] sign error', sErr);
      return json(500, { error: 'sign failed' });
    }

    return json(200, { signedUrl: signed.signedUrl, expiresIn: 3600 });
  } catch (e) {
    console.error('[get-shared-image] unexpected', e);
    return json(500, { error: 'unexpected' });
  }
});