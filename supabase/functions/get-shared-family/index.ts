import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { checkRateLimit, getClientIP } from '../_shared/rateLimiter.ts';
import { isSocialMediaBot } from '../_shared/botDetector.ts';
import { buildOGHtml } from '../_shared/ogHtmlBuilder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Deno serve handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Detect if request is from a bot
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = isSocialMediaBot(userAgent);
  console.log(`[get-shared-family] Request from ${isBot ? 'BOT' : 'USER'}: ${userAgent}`);

  try {
    // Rate limiting
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(clientIP, {
      maxAttempts: 100,
      windowMs: 30 * 60 * 1000, // 100 requests per 30 minutes
      backoffMultiplier: 2,
    });

    if (!rateLimitResult.allowed) {
      console.log(`[get-shared-family] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TOO_MANY_REQUESTS',
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { share_token, password } = await req.json();

    if (!share_token) {
      console.error('[get-shared-family] Missing share_token in request');
      return new Response(
        JSON.stringify({ success: false, error: 'TOKEN_REQUIRED' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[get-shared-family] Received request for token: ${share_token}`);

    // Create Supabase Admin client using Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Step 1: Validate token and check expiration
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('share_token', share_token)
      .single();

    if (familyError || !family) {
      console.error('[get-shared-family] Token not found:', familyError);
      return new Response(
        JSON.stringify({ success: false, error: 'TOKEN_INVALID' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(family.share_token_expires_at);
    if (expiresAt < now) {
      console.log('[get-shared-family] Token expired for family:', family.id);
      return new Response(
        JSON.stringify({ success: false, error: 'TOKEN_EXPIRED' }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Check password if required
    if (family.share_password) {
      if (!password) {
        console.log('[get-shared-family] Password required but not provided');
        return new Response(
          JSON.stringify({ success: false, error: 'PASSWORD_REQUIRED' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Verify password using bcrypt hashing function
      const { data: verifyResult, error: verifyError } = await supabaseAdmin
        .rpc('verify_share_password', {
          plain_password: password,
          hashed_password: family.share_password,
        });

      if (verifyError || !verifyResult) {
        console.log('[get-shared-family] Invalid password provided');
        return new Response(
          JSON.stringify({ success: false, error: 'PASSWORD_INCORRECT' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('[get-shared-family] Token and password validated successfully');

    // If bot detected, return HTML with OG tags
    if (isBot) {
      console.log('[get-shared-family] Bot detected, returning HTML with OG tags');
      
      // Fetch social media settings
      const { data: settings } = await supabaseAdmin
        .from('social_media_settings')
        .select('*')
        .single();

      // Extract family name (handle both string and JSONB)
      let familyName = '';
      if (typeof family.name === 'string') {
        familyName = family.name;
      } else if (family.name && typeof family.name === 'object') {
        familyName = family.name.ar || family.name.en || 'عائلة';
      }

      // Build OG tag values
      const siteName = settings?.site_name?.ar || 'منصة شجرتي';
      const title = `${siteName} - عائلة ${familyName}`;
      const description = settings?.default_description?.ar || 'شجرة عائلة احترافية';
      const imageUrl = settings?.og_image_url || 'https://storage.googleapis.com/gpt-engineer-file-uploads/40QKdYAYFAQFZioSlYbRsHqzdNU2/uploads/1761540682197-shjrti.png';
      const currentUrl = `https://shjrti.com/share?token=${share_token}`;
      const twitterHandle = settings?.twitter_handle || '';

      const html = buildOGHtml(title, description, imageUrl, siteName, currentUrl, twitterHandle);

      return new Response(html, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        }
      });
    }

    // For regular users, fetch and return JSON data
    // Step 3: Fetch all family data using Service Role
    const [membersResult, marriagesResult] = await Promise.all([
      supabaseAdmin
        .from('family_tree_members')
        .select('*')
        .eq('family_id', family.id)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('marriages')
        .select('*')
        .eq('family_id', family.id),
    ]);

    if (membersResult.error) {
      console.error('[get-shared-family] Error fetching members:', membersResult.error);
      return new Response(
        JSON.stringify({ success: false, error: 'FETCH_ERROR' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (marriagesResult.error) {
      console.error('[get-shared-family] Error fetching marriages:', marriagesResult.error);
      return new Response(
        JSON.stringify({ success: false, error: 'FETCH_ERROR' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[get-shared-family] Successfully fetched data for family: ${family.id}`);
    console.log(`[get-shared-family] Members: ${membersResult.data?.length || 0}, Marriages: ${marriagesResult.data?.length || 0}`);

    // Step 4: Apply female privacy settings before returning data
    const femaleNamePrivacy = family.female_name_privacy || 'full';
    const femalePhotoHidden = family.female_photo_hidden || false;
    
    let processedMembers = membersResult.data || [];
    
    // Apply privacy settings for female members
    if (femaleNamePrivacy !== 'full' || femalePhotoHidden) {
      processedMembers = processedMembers.map((member: any) => {
        if (member.gender === 'female') {
          const processedMember = { ...member };
          
          // Apply name privacy
          if (femaleNamePrivacy === 'hidden') {
            processedMember.first_name = null;
            processedMember.name = null;
            processedMember.name_hidden = true;
          } else if (femaleNamePrivacy === 'family_only') {
            processedMember.first_name = null;
            processedMember.name = null; // Hide full name too, frontend will show lineage only
            processedMember.name_hidden = true;
            // Keep last_name and parentage info intact for lineage display
          }
          
          // Apply photo privacy
          if (femalePhotoHidden) {
            processedMember.image_url = null;
            processedMember.image_hidden = true;
          }
          
          return processedMember;
        }
        return member;
      });
    }

    // Step 5: Return data to frontend
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          family,
          members: processedMembers,
          marriages: marriagesResult.data || [],
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[get-shared-family] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
