import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { suggestionId, verificationCode } = await req.json();

    if (!suggestionId || !verificationCode) {
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
      return new Response(
        JSON.stringify({ error: "Suggestion not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified
    if (suggestion.is_email_verified) {
      return new Response(
        JSON.stringify({ error: "Suggestion already verified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if code matches
    if (suggestion.verification_code !== verificationCode) {
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

    // Send confirmation email to submitter
    try {
      await resend.emails.send({
        from: "Family Tree <onboarding@resend.dev>",
        to: [suggestion.submitter_email],
        subject: "Your Edit Suggestion Has Been Submitted",
        html: `
          <h1>Suggestion Submitted Successfully</h1>
          <p>Hello ${suggestion.submitter_name},</p>
          <p>Thank you for your suggestion to ${suggestion.families?.name || "the family tree"}.</p>
          <p>Your suggestion has been submitted and the tree owner will review it shortly.</p>
          <p>We'll send you an email when your suggestion is reviewed.</p>
          <br>
          <p><strong>Your Suggestion:</strong></p>
          <p>${suggestion.suggestion_text}</p>
        `,
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
