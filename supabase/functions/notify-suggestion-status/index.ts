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

    const { suggestionId, status, adminNotes } = await req.json();

    if (!suggestionId || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get suggestion details
    const { data: suggestion, error: fetchError } = await supabase
      .from("tree_edit_suggestions")
      .select("*, families(name)")
      .eq("id", suggestionId)
      .single();

    if (fetchError || !suggestion) {
      return new Response(
        JSON.stringify({ error: "Suggestion not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare email based on status
    let subject = "";
    let html = "";

    if (status === "accepted") {
      subject = "Your Edit Suggestion Has Been Accepted";
      html = `
        <h1>Great News!</h1>
        <p>Hello ${suggestion.submitter_name},</p>
        <p>Your suggestion to ${suggestion.families?.name || "the family tree"} has been accepted!</p>
        <br>
        <p><strong>Your Suggestion:</strong></p>
        <p>${suggestion.suggestion_text}</p>
        ${adminNotes ? `
        <br>
        <p><strong>Owner's Notes:</strong></p>
        <p>${adminNotes}</p>
        ` : ''}
        <br>
        <p>Thank you for helping to keep the family tree accurate and complete!</p>
      `;
    } else if (status === "rejected") {
      subject = "Update on Your Edit Suggestion";
      html = `
        <h1>Edit Suggestion Update</h1>
        <p>Hello ${suggestion.submitter_name},</p>
        <p>Thank you for your suggestion to ${suggestion.families?.name || "the family tree"}.</p>
        <p>After careful review, the tree owner has decided not to accept this suggestion at this time.</p>
        <br>
        <p><strong>Your Suggestion:</strong></p>
        <p>${suggestion.suggestion_text}</p>
        ${adminNotes ? `
        <br>
        <p><strong>Owner's Notes:</strong></p>
        <p>${adminNotes}</p>
        ` : ''}
        <br>
        <p>We appreciate your contribution to maintaining an accurate family history.</p>
      `;
    }

    // Send email notification
    try {
      await resend.emails.send({
        from: "Family Tree <onboarding@resend.dev>",
        to: [suggestion.submitter_email],
        subject,
        html,
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send notification email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully",
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
