import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIP } from "../_shared/rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: max 3 verification attempts per minute per IP
    const clientIP = getClientIP(req);
    const rateLimitResult = checkRateLimit(`verify-suggestion:${clientIP}`, {
      maxAttempts: 3,
      windowMs: 60 * 1000, // 1 minute
      backoffMultiplier: 2, // Exponential backoff on repeated failures
    });

    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP}`);
      return new Response(
        JSON.stringify({
          error: "Too many verification attempts. Please wait before trying again.",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { suggestionId, verificationCode } = await req.json();

    if (!suggestionId || !verificationCode) {
      console.error("Missing required fields:", { suggestionId, verificationCode });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get suggestion
    const { data: suggestion, error: fetchError } = await supabase
      .from("tree_edit_suggestions")
      .select("*, families(name, creator_id)")
      .eq("id", suggestionId)
      .single();

    if (fetchError || !suggestion) {
      console.error("Suggestion not found:", { suggestionId, fetchError });
      return new Response(
        JSON.stringify({ error: "Suggestion not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified
    if (suggestion.is_email_verified) {
      console.warn("Suggestion already verified:", suggestionId);
      return new Response(
        JSON.stringify({ error: "Suggestion already verified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize codes for comparison (trim and convert to string)
    const storedCode = String(suggestion.verification_code || '').trim();
    const providedCode = String(verificationCode || '').trim();
    
    console.log("Verification attempt:", {
      suggestionId,
      storedCode,
      providedCode,
      match: storedCode === providedCode
    });

    // Check if code matches
    if (storedCode !== providedCode) {
      console.warn(`Invalid verification code from IP ${clientIP} for suggestion ${suggestionId}. Expected: "${storedCode}", Got: "${providedCode}"`);
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if code expired
    const expiresAt = new Date(suggestion.verification_code_expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: "Verification code expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update suggestion as verified
    const { error: updateError } = await supabase
      .from("tree_edit_suggestions")
      .update({
        is_email_verified: true,
        verification_code: null,
        verification_code_expires_at: null,
      })
      .eq("id", suggestionId);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to verify suggestion" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send confirmation email to submitter using templated email service
    try {
      await supabase.functions.invoke('send-templated-email', {
        body: {
          templateKey: 'edit_suggestion_confirmed',
          recipientEmail: suggestion.submitter_email,
          recipientName: suggestion.submitter_name,
          variables: {
            name: suggestion.submitter_name,
            familyName: suggestion.families?.name || 'the family tree',
            suggestionText: suggestion.suggestion_text,
          },
          languageCode: 'ar', // Default to Arabic, could be made dynamic
        },
      });
    } catch (emailError) {
      console.error("Confirmation email error:", emailError);
    }

    // Create notification for tree owner
    try {
      await supabase.from("notifications").insert({
        user_id: suggestion.families.creator_id,
        title: "New Edit Suggestion",
        message: `${suggestion.submitter_name} suggested an edit to your family tree`,
        type: "info",
      });
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    console.log(`Suggestion ${suggestionId} verified successfully from IP ${clientIP}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Suggestion verified and submitted successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
