import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, getClientIP } from '../_shared/rateLimiter.ts';
import { isSocialMediaBot } from '../_shared/botDetector.ts';
import { buildOGHtml } from '../_shared/ogHtmlBuilder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Validate custom domain format
 * Allows: alphanumeric, hyphens, forward slashes
 * Max length: 100 characters
 */
const validateCustomDomain = (domain: string): boolean => {
  if (!domain || typeof domain !== 'string') {
    return false;
  }
  
  // Length validation
  if (domain.length > 100) {
    return false;
  }
  
  // Character whitelist: alphanumeric, hyphens, forward slashes
  const domainRegex = /^[a-zA-Z0-9\-\/]+$/;
  return domainRegex.test(domain.trim());
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Detect if request is from a bot
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = isSocialMediaBot(userAgent);
  console.log(`[custom-domain-redirect] Request from ${isBot ? 'BOT' : 'USER'}: ${userAgent}`);

  // Rate limiting - 100 requests per 30 minutes
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP, {
    maxAttempts: 100,
    windowMs: 30 * 60 * 1000, // 30 minutes
    backoffMultiplier: 2,
  });

  if (!rateLimitResult.allowed) {
    console.log(`[custom-domain-redirect] Rate limit exceeded for IP: ${clientIP}`);
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

  try {
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

    // Read and validate customDomain (+ optional password) from request body
    const { customDomain, password } = await req.json();

    if (!customDomain) {
      console.error('[custom-domain-redirect] Missing customDomain in request');
      return new Response(
        JSON.stringify({ success: false, error: 'DOMAIN_REQUIRED' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate domain format
    if (!validateCustomDomain(customDomain)) {
      console.error('[custom-domain-redirect] Invalid domain format:', customDomain);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'INVALID_DOMAIN_FORMAT',
          message: 'Domain must be alphanumeric with hyphens/slashes, max 100 chars'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[custom-domain-redirect] Received request for domain: ${customDomain}`);

    // Step 1: Look up the family by custom domain
    // Note: Custom domains have permanent access (no expiration check)
    const { data: family, error: familyError } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('custom_domain', customDomain)
      .single();

    if (familyError || !family) {
      console.error('[custom-domain-redirect] Domain not found:', familyError);
      return new Response(
        JSON.stringify({ success: false, error: 'DOMAIN_NOT_FOUND' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[custom-domain-redirect] Family found: ${family.id}`);

    // Step 1.5: Enforce share password (return 200 with structured response so supabase-js doesn't treat it as a network error)
    if (family.share_password) {
      const familyName =
        typeof family.name === 'string'
          ? family.name
          : family?.name?.ar || family?.name?.en || 'عائلة';

      if (!password) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'PASSWORD_REQUIRED',
            familyName,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: verifyResult, error: verifyError } = await supabaseAdmin.rpc(
        'verify_share_password',
        {
          plain_password: password,
          hashed_password: family.share_password,
        }
      );

      if (verifyError || !verifyResult) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'PASSWORD_INCORRECT',
            familyName,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // If bot detected, return HTML with OG tags
    if (isBot) {
      console.log('[custom-domain-redirect] Bot detected, returning HTML with OG tags');
      
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
      const currentUrl = `https://shjrti.com/${customDomain}`;
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
    // Step 2: Fetch all family members using Service Role Key (bypasses RLS)
    const { data: members, error: membersError } = await supabaseAdmin
      .from('family_tree_members')
      .select('*')
      .eq('family_id', family.id);

    if (membersError) {
      console.error('[custom-domain-redirect] Error fetching members:', membersError);
      return new Response(
        JSON.stringify({ success: false, error: 'DATA_FETCH_ERROR' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Fetch all marriages using Service Role Key (bypasses RLS)
    const { data: marriages, error: marriagesError } = await supabaseAdmin
      .from('marriages')
      .select('*')
      .eq('family_id', family.id);

    if (marriagesError) {
      console.error('[custom-domain-redirect] Error fetching marriages:', marriagesError);
      return new Response(
        JSON.stringify({ success: false, error: 'DATA_FETCH_ERROR' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[custom-domain-redirect] Successfully fetched data - Members: ${members?.length || 0}, Marriages: ${marriages?.length || 0}`);

    // Step 4: Apply female privacy settings before returning data
    const femaleNamePrivacy = family.female_name_privacy || 'full';
    const femalePhotoHidden = family.female_photo_hidden === true;
    
    console.log(`[custom-domain-redirect] Privacy settings - Name: ${femaleNamePrivacy}, Photo Hidden: ${femalePhotoHidden}`);
    
    let processedMembers = members || [];
    let femaleCount = 0;
    let processedCount = 0;
    
    // Apply privacy settings for female members
    if (femaleNamePrivacy !== 'full' || femalePhotoHidden) {
      processedMembers = processedMembers.map((member: any) => {
        if (member.gender === 'female') {
          femaleCount++;
          const processedMember = { ...member };
          let wasProcessed = false;
          
          // Apply name privacy
          if (femaleNamePrivacy === 'hidden') {
            processedMember.first_name = null;
            processedMember.name = null;
            processedMember.name_hidden = true;
            wasProcessed = true;
          } else if (femaleNamePrivacy === 'family_only') {
            processedMember.first_name = null;
            processedMember.name = null; // Hide full name too, frontend will show lineage only
            processedMember.name_hidden = true;
            wasProcessed = true;
            // Keep last_name and parentage info intact for lineage display
          }
          
          // Apply photo privacy
          if (femalePhotoHidden) {
            processedMember.image_url = null;
            processedMember.image_hidden = true;
            wasProcessed = true;
          }
          
          if (wasProcessed) processedCount++;
          return processedMember;
        }
        return member;
      });
      
      console.log(`[custom-domain-redirect] Privacy applied - Total females: ${femaleCount}, Processed: ${processedCount}`);
    }

    // Step 5: Fetch recent activity logs
    const { data: activityLogs } = await supabaseAdmin
      .from('activity_log')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Enrich activity logs with user names
    let enrichedActivities = activityLogs || [];
    if (enrichedActivities.length > 0) {
      const userIds = [...new Set(enrichedActivities.map((log: any) => log.user_id))];
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]));
      enrichedActivities = enrichedActivities.map((log: any) => ({
        ...log,
        actor_name: profileMap.get(log.user_id) || '',
      }));
    }

    // Return all family data (same structure as get-shared-family)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          family,
          members: processedMembers,
          marriages: marriages || [],
          activities: enrichedActivities,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in custom-domain-redirect:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
