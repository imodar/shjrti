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
    const { email, otpCode, purpose, password, userData } = await req.json();

    if (!email || !otpCode || !purpose) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, otpCode, purpose" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`Verifying OTP for ${email}, purpose: ${purpose}`);

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from("auth_otp_codes")
      .select("*")
      .eq("email", email)
      .eq("otp_code", otpCode)
      .eq("purpose", purpose)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle instead of single

    if (otpError || !otpRecord) {
      console.error("Invalid or expired OTP:", otpError);
      // Return 200 with a structured error to avoid client-side 4xx handling
      return new Response(
        JSON.stringify({ success: false, error: "OTP_INVALID_OR_EXPIRED" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP verified successfully for ${email}`);

    // Mark OTP as used
    await supabase
      .from("auth_otp_codes")
      .update({ is_used: true })
      .eq("id", otpRecord.id);

    // Handle different purposes
    let authResult;
    
    if (purpose === 'signup') {
      // استخراج البيانات من otpRecord.user_data
      const storedUserData = otpRecord.user_data || {};
      const storedPassword = storedUserData.password || password;
      
      if (!storedPassword) {
        return new Response(
          JSON.stringify({ error: "Password is required for signup" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Creating new user account for ${email}`);

      // Create user with email already confirmed
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password: storedPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: storedUserData.first_name || userData?.first_name || '',
          last_name: storedUserData.last_name || userData?.last_name || '',
          full_name: `${storedUserData.first_name || userData?.first_name || ''} ${storedUserData.last_name || userData?.last_name || ''}`.trim(),
          phone: storedUserData.phone || userData?.phone || ''
        }
      });

      if (signUpError) {
        console.error("Error creating user:", signUpError);
        return new Response(
          JSON.stringify({ error: signUpError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      authResult = signUpData;
      console.log(`User created successfully: ${email}`);

      // تحديث حالة المستخدم إلى active بعد التحقق من OTP
      if (signUpData.user) {
        console.log(`Setting user status to active for: ${signUpData.user.id}`);
        await supabase
          .from('user_status')
          .upsert({
            user_id: signUpData.user.id,
            status: 'active'
          }, {
            onConflict: 'user_id'
          });
      }

      // إرسال إيميل الترحيب للمستخدم الجديد
      console.log(`Sending welcome email to: ${email}`);
      const welcomeEmailPromise = supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          firstName: storedUserData.first_name || userData?.first_name || '',
          lastName: storedUserData.last_name || userData?.last_name || '',
          language: 'ar'
        }
      }).catch(error => {
        console.error('Failed to send welcome email:', error);
      });

      // تشغيل إرسال الإيميل في الخلفية دون انتظار
      EdgeRuntime.waitUntil(welcomeEmailPromise);

    } else if (purpose === 'login') {
      // For login, sign in with email/password (if provided) or generate session
      if (password) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error("Error signing in:", signInError);
          return new Response(
            JSON.stringify({ error: signInError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        authResult = signInData;
      } else {
        // Generate OTP link for passwordless login
        const { data: otpData, error: otpLinkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: email
        });

        if (otpLinkError) {
          console.error("Error generating magic link:", otpLinkError);
          return new Response(
            JSON.stringify({ error: "Failed to generate login session" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        authResult = otpData;
      }

      console.log(`User logged in successfully: ${email}`);

    } else if (purpose === 'reset_password') {
      if (!password) {
        return new Response(
          JSON.stringify({ error: "New password is required for reset" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users.find(u => u.email === email);

      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password }
      );

      if (updateError) {
        console.error("Error updating password:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update password" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Password reset successfully for ${email}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        data: authResult
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
