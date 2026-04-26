import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { email, password } = await req.json();
    
    console.log(`[Secure Login] Attempt for email: ${email}`);

    // التحقق من المدخلات
    if (!email || !password) {
      console.error('[Secure Login] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // إنشاء Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. التحقق من Rate Limiting
    console.log('[Secure Login] Checking rate limit...');
    const { data: rateLimitData, error: rateLimitError } = await supabase
      .rpc('check_failed_login_attempts', { 
        user_email: email,
        max_attempts: 5,
        time_window_minutes: 15
      })
      .single();

    if (rateLimitError) {
      console.error('[Secure Login] Rate limit check error:', rateLimitError);
    }

    if (rateLimitData && !(rateLimitData as any).is_allowed) {
      const resetTime = new Date((rateLimitData as any).reset_time);
      const minutesRemaining = Math.ceil((resetTime.getTime() - Date.now()) / 60000);
      
      console.warn(`[Secure Login] Rate limit exceeded for ${email}`);
      
      // تسجيل المحاولة الفاشلة
      await supabase.rpc('log_login_attempt', {
        user_email: email,
        user_ip: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent_text: req.headers.get('user-agent') || 'unknown',
        is_success: false,
        reason: 'rate_limit_exceeded'
      });

      return new Response(
        JSON.stringify({ 
          error: `تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى بعد ${minutesRemaining} دقيقة`,
          rateLimitExceeded: true,
          resetTime: resetTime.toISOString(),
          remainingMinutes: minutesRemaining
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. محاولة تسجيل الدخول
    console.log('[Secure Login] Attempting authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('[Secure Login] Authentication failed:', authError.message);
      
      // تسجيل المحاولة الفاشلة
      await supabase.rpc('log_login_attempt', {
        user_email: email,
        user_ip: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent_text: req.headers.get('user-agent') || 'unknown',
        is_success: false,
        reason: authError.message
      });

      return new Response(
        JSON.stringify({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. تسجيل المحاولة الناجحة
    console.log(`[Secure Login] Login successful for ${email}`);
    await supabase.rpc('log_login_attempt', {
      user_email: email,
      user_ip: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent_text: req.headers.get('user-agent') || 'unknown',
      is_success: true,
      reason: null
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        session: authData.session,
        user: authData.user
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Secure Login] Error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
