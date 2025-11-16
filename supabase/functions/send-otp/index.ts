import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, purpose, userData } = await req.json();

    if (!email || !purpose) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, purpose" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate purpose
    if (!['signup', 'login', 'reset_password'].includes(purpose)) {
      return new Response(
        JSON.stringify({ error: "Invalid purpose. Must be: signup, login, or reset_password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    console.log(`Generating OTP for ${email}, purpose: ${purpose}`);

    // Save OTP to database with userData
    const { data: otpRecord, error: otpError } = await supabase
      .from("auth_otp_codes")
      .insert({
        email,
        otp_code: otpCode,
        purpose,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        user_data: userData || null // حفظ بيانات المستخدم بما فيها كلمة المرور
      })
      .select()
      .single();

    if (otpError) {
      console.error("Error saving OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP saved successfully for ${email}`);

    // Determine template key based on purpose
    let templateKey = '';
    const variables: Record<string, string> = {
      otp_code: otpCode,
      email: email
    };

    switch (purpose) {
      case 'signup':
        templateKey = 'signup_otp';
        if (userData?.first_name) variables.first_name = userData.first_name;
        if (userData?.last_name) variables.last_name = userData.last_name;
        break;
      case 'login':
        templateKey = 'login_otp';
        break;
      case 'reset_password':
        templateKey = 'reset_password_otp';
        break;
    }

    console.log(`Calling send-templated-email with template: ${templateKey}`);

    // Call send-templated-email function
    const { data: emailData, error: emailError } = await supabase.functions.invoke(
      'send-templated-email',
      {
        body: {
          templateKey,
          recipientEmail: email,
          recipientName: userData?.first_name || email,
          variables,
          languageCode: 'ar' // Default to Arabic
        }
      }
    );

    if (emailError) {
      console.error("Error sending email:", emailError);
      // Delete the OTP since email failed
      await supabase.from("auth_otp_codes").delete().eq("id", otpRecord.id);
      
      return new Response(
        JSON.stringify({ error: "Failed to send OTP email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
