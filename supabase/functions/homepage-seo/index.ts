import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { isSocialMediaBot } from '../_shared/botDetector.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SEOSettings {
  homepage_title: { ar: string; en: string };
  homepage_description: { ar: string; en: string };
  homepage_keywords: { ar: string; en: string };
  organization_name: { ar: string; en: string };
  organization_logo_url?: string;
  theme_color: string;
}

function buildSEOHtml(settings: SEOSettings, lang: string = 'ar'): string {
  const title = settings.homepage_title[lang as 'ar' | 'en'] || settings.homepage_title.ar;
  const description = settings.homepage_description[lang as 'ar' | 'en'] || settings.homepage_description.ar;
  const keywords = settings.homepage_keywords[lang as 'ar' | 'en'] || settings.homepage_keywords.ar;
  const orgName = settings.organization_name[lang as 'ar' | 'en'] || settings.organization_name.ar;
  
  const escapedTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedDesc = description.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedKeywords = keywords.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <meta name="description" content="${escapedDesc}">
  <meta name="keywords" content="${escapedKeywords}">
  
  <!-- Open Graph Tags -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${escapedTitle.replace(/"/g, '&quot;')}">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDesc}">
  <meta property="og:url" content="https://shjrti.com/">
  ${settings.organization_logo_url ? `<meta property="og:image" content="${settings.organization_logo_url}">` : ''}
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedDesc}">
  ${settings.organization_logo_url ? `<meta name="twitter:image" content="${settings.organization_logo_url}">` : ''}
  
  <!-- Theme Color -->
  <meta name="theme-color" content="${settings.theme_color}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://shjrti.com/">
  
  <!-- Hreflang Tags -->
  <link rel="alternate" hreflang="ar" href="https://shjrti.com/">
  <link rel="alternate" hreflang="en" href="https://shjrti.com/?lang=en">
  <link rel="alternate" hreflang="x-default" href="https://shjrti.com/">
  
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.2rem;
      line-height: 1.6;
    }
  </style>
  
  <!-- Redirect for non-bot users -->
  <script>
    // Only redirect if not a bot
    if (!/bot|crawl|spider|slurp|facebook|whatsapp|twitter|telegram|linkedin|discord|pinterest/i.test(navigator.userAgent)) {
      window.location.href = '/';
    }
  </script>
</head>
<body>
  <div class="container">
    <h1>${orgName}</h1>
    <p>${description}</p>
    <p><a href="/" style="color: white; text-decoration: underline;">انتقل إلى الموقع / Go to Website</a></p>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Detect if request is from a bot
    const userAgent = req.headers.get('user-agent') || '';
    const isBot = isSocialMediaBot(userAgent);
    
    console.log('[homepage-seo] User-Agent:', userAgent);
    console.log('[homepage-seo] Is Bot:', isBot);

    // Get language from query parameter
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') || 'ar';

    // Fetch SEO settings from database
    const { data: settings, error } = await supabase
      .from('seo_settings')
      .select('*')
      .single();

    if (error || !settings) {
      console.error('[homepage-seo] Error fetching settings:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch SEO settings' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If it's a bot, return HTML with meta tags
    if (isBot) {
      console.log('[homepage-seo] Returning SEO HTML for bot');
      const html = buildSEOHtml(settings, lang);
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    // For regular users, return JSON with settings
    console.log('[homepage-seo] Returning JSON for regular user');
    return new Response(
      JSON.stringify({ settings }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('[homepage-seo] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? (error as Error).message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
