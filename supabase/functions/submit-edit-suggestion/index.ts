import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, validateEmail, getClientIP } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: max 5 submissions per hour per IP
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`submit-suggestion:${clientIP}`, {
      maxAttempts: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many submission attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": rateLimitResult.retryAfter?.toString() || "3600",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      familyId,
      memberId,
      submitterName,
      submitterEmail,
      suggestionType,
      suggestionText,
      suggestedChanges,
    } = await req.json();

    // Validation
    if (!familyId || !submitterName || !submitterEmail || !suggestionType || !suggestionText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email validation
    if (!validateEmail(submitterEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Additional rate limiting per email: max 3 submissions per hour per email
    const emailRateLimitResult = checkRateLimit(`submit-suggestion:email:${submitterEmail}`, {
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!emailRateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many submissions from this email. Please try again later.",
          retryAfter: emailRateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": emailRateLimitResult.retryAfter?.toString() || "3600",
          },
        }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Insert suggestion into database
    const { data: suggestion, error: insertError } = await supabase
      .from("tree_edit_suggestions")
      .insert({
        family_id: familyId,
        member_id: memberId || null,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        suggestion_type: suggestionType,
        suggestion_text: suggestionText,
        suggested_changes: suggestedChanges || null,
        verification_code: verificationCode,
        verification_code_expires_at: expiresAt.toISOString(),
        is_email_verified: false,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save suggestion" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get family name for email
    const { data: family } = await supabase
      .from("families")
      .select("name")
      .eq("id", familyId)
      .single();

    // Send verification email using templated email service
    try {
      await supabase.functions.invoke('send-templated-email', {
        body: {
          templateKey: 'edit_suggestion_verification',
          recipientEmail: submitterEmail,
          recipientName: submitterName,
          variables: {
            name: submitterName,
            familyName: family?.name || 'Family Tree',
            verificationCode: verificationCode,
            expiryMinutes: '10',
          },
          languageCode: 'ar', // Default to Arabic, could be made dynamic
        },
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Continue even if email fails - user can request new code
    }

    console.log(`Suggestion submitted from IP ${clientIP}, ${rateLimitResult.attemptsRemaining} attempts remaining`);

    return new Response(
      JSON.stringify({
        success: true,
        suggestionId: suggestion.id,
        message: "Verification code sent to your email",
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
