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
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      recaptchaToken 
    } = await req.json();
    
    console.log(`[Secure Signup] Registration attempt for email: ${email}`);

    // التحقق من المدخلات
    if (!email || !password || !firstName || !lastName) {
      console.error('[Secure Signup] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'جميع الحقول مطلوبة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // إنشاء Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. التحقق من reCAPTCHA
    if (recaptchaToken) {
      console.log('[Secure Signup] Verifying reCAPTCHA...');
      const recaptchaResponse = await fetch(
        `${supabaseUrl}/functions/v1/verify-recaptcha`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ token: recaptchaToken, action: 'signup' })
        }
      );

      const recaptchaResult = await recaptchaResponse.json();
      
      if (!recaptchaResult.success) {
        console.warn('[Secure Signup] reCAPTCHA verification failed');
        return new Response(
          JSON.stringify({ error: 'فشل التحقق الأمني. يرجى المحاولة مرة أخرى' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`[Secure Signup] reCAPTCHA passed with score: ${recaptchaResult.score}`);
    }

    // 2. التحقق من وجود المستخدم
    console.log('[Secure Signup] Checking if user exists...');
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.warn(`[Secure Signup] User already exists: ${email}`);
      return new Response(
        JSON.stringify({ error: 'البريد الإلكتروني مسجل بالفعل' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. إنشاء المستخدم
    console.log('[Secure Signup] Creating user...');
    const redirectUrl = req.headers.get('origin') || 'https://cd2d25f7-7b31-497f-b193-004048ecdca6.lovableproject.com';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${redirectUrl}/dashboard`,
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone || ''
        }
      }
    });

    if (authError) {
      console.error('[Secure Signup] Signup failed:', authError.message);
      
      // رسائل خطأ مخصصة
      if (authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'البريد الإلكتروني مسجل بالفعل' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (authError.message.includes('password')) {
        return new Response(
          JSON.stringify({ error: 'كلمة المرور ضعيفة. يجب أن تكون 8 أحرف على الأقل' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Secure Signup] User created successfully: ${email}`);

    // 4. إنشاء user status (pending)
    if (authData.user) {
      console.log('[Secure Signup] Creating user status...');
      await supabase
        .from('user_status')
        .insert({
          user_id: authData.user.id,
          status: 'pending'
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك',
        user: authData.user,
        session: authData.session
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Secure Signup] Error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
