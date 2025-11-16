import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action = 'submit' } = await req.json();
    
    if (!token) {
      console.error('[reCAPTCHA] No token provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA token is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    
    if (!secretKey) {
      console.error('[reCAPTCHA] Secret key not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[reCAPTCHA] Verifying token for action: ${action}`);

    // التحقق من reCAPTCHA
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
    const verifyBody = `secret=${secretKey}&response=${token}`;

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: verifyBody
    });

    const result = await response.json();
    
    console.log('[reCAPTCHA] Verification result:', {
      success: result.success,
      score: result.score,
      action: result.action,
      challenge_ts: result.challenge_ts,
      hostname: result.hostname
    });

    // التحقق من النتيجة
    if (!result.success) {
      console.error('[reCAPTCHA] Verification failed:', result['error-codes']);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA verification failed',
          details: result['error-codes']
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // التحقق من Score (يجب أن يكون >= 0.5)
    const minScore = 0.5;
    if (result.score < minScore) {
      console.warn(`[reCAPTCHA] Score too low: ${result.score} (minimum: ${minScore})`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          score: result.score,
          error: 'Security check failed. Please try again.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // التحقق من Action
    if (result.action !== action) {
      console.warn(`[reCAPTCHA] Action mismatch: expected ${action}, got ${result.action}`);
    }

    console.log(`[reCAPTCHA] Verification successful - Score: ${result.score}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: result.score,
        action: result.action
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[reCAPTCHA] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
