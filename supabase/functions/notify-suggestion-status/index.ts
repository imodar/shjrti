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
      console.error("Failed to fetch suggestion:", fetchError);
      return new Response(
        JSON.stringify({ error: "Suggestion not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending notification for suggestion:", {
      id: suggestionId,
      status,
      email: suggestion.submitter_email,
      name: suggestion.submitter_name
    });

    // Determine template key based on status
    const templateKey = status === "accepted" ? "suggestion_accepted" : "suggestion_rejected";

    // Prepare variables for email template
    const emailVariables: Record<string, string> = {
      name: suggestion.submitter_name,
      familyName: suggestion.families?.name || 'شجرة العائلة',
      suggestionText: suggestion.suggestion_text,
    };

    // Add admin notes if provided
    if (adminNotes) {
      emailVariables.adminNotes = adminNotes;
    }

    // Send email using templated email service
    try {
      const { data: emailResult, error: emailError } = await supabase.functions.invoke("send-templated-email", {
        body: {
          templateKey,
          recipientEmail: suggestion.submitter_email,
          recipientName: suggestion.submitter_name,
          variables: emailVariables,
          languageCode: 'ar', // Default to Arabic
        },
      });

      if (emailError) {
        console.error("Email service error:", emailError);
        return new Response(
          JSON.stringify({ error: "Failed to send notification email", details: emailError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Email sent successfully:", emailResult);
    } catch (emailError) {
      console.error("Email error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send notification email", details: emailError.message }),
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
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
