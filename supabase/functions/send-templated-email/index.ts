import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Resend client once
const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

// Replace variables in template
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  
  // Handle conditional blocks like {{#if variable}}...{{/if}}
  result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
    return variables[varName] ? content : '';
  });
  
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      templateKey, 
      recipientEmail, 
      recipientName, 
      variables = {},
      languageCode = 'en'
    } = await req.json();

    if (!templateKey || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: templateKey, recipientEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      console.error("Template error:", templateError);
      
      // Log failed attempt
      await supabase.from("email_logs").insert({
        template_key: templateKey,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: "Template not found",
        body: "",
        variables,
        status: "failed",
        error_message: `Template ${templateKey} not found or inactive`
      });

      return new Response(
        JSON.stringify({ error: "Email template not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get localized content
    const subject = template.subject[languageCode] || template.subject.en || Object.values(template.subject)[0];
    const body = template.body[languageCode] || template.body.en || Object.values(template.body)[0];

    // Replace variables in subject and body
    const finalSubject = replaceVariables(subject, variables);
    const finalBody = replaceVariables(body, variables);

    console.log(`Sending email to ${recipientEmail} using template ${templateKey}`);

    // Send email via Resend (recommended for serverless)
    try {
      const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "no-reply@shjrti.com";

      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: [recipientEmail],
        subject: finalSubject,
        html: finalBody,
      });

      console.log("Resend response:", emailResponse);

      // Log successful email
      await supabase.from("email_logs").insert({
        template_key: templateKey,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: finalSubject,
        body: finalBody,
        variables,
        status: "sent",
      });

      console.log(`Email sent successfully to ${recipientEmail}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email sent successfully" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("Email sending error (Resend):", emailError);

      // Log failed email
      await supabase.from("email_logs").insert({
        template_key: templateKey,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: finalSubject,
        body: finalBody,
        variables,
        status: "failed",
        error_message: (emailError as any)?.message ?? JSON.stringify(emailError),
      });

      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
