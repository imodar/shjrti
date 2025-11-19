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
      phone
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

    // 1. التحقق من وجود المستخدم
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

    // 2. إرسال OTP بدلاً من إنشاء المستخدم مباشرة
    console.log('[Secure Signup] Sending OTP...');
    
    const { data: otpData, error: otpError } = await supabase.functions.invoke(
      'send-otp',
      {
        body: {
          email,
          purpose: 'signup',
          userData: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || ''
            // password is NOT sent here (security fix) - will be provided during verification
          }
        }
      }
    );

    if (otpError || !otpData?.success) {
      console.error('[Secure Signup] Failed to send OTP:', otpError);
      return new Response(
        JSON.stringify({ 
          error: otpData?.error || 'فشل إرسال رمز التحقق. يرجى المحاولة مرة أخرى' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Secure Signup] OTP sent successfully to: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
        expiresAt: otpData.expiresAt
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
