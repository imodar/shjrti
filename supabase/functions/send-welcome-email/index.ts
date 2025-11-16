import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface WelcomeEmailRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  language?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, language = 'ar' }: WelcomeEmailRequest = await req.json();
    
    console.log(`[Welcome Email] Sending to: ${email}, language: ${language}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get welcome email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', 'welcome')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('[Welcome Email] Template not found:', templateError);
      return new Response(
        JSON.stringify({ error: 'Welcome email template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get subject and body in the correct language
    const subject = template.subject?.[language] || template.subject?.['ar'] || 'مرحباً بك';
    let body = template.body?.[language] || template.body?.['ar'] || '';

    // Replace variables in the email body
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'عزيزي المستخدم';
    body = body.replace(/\{\{firstName\}\}/g, firstName || '')
               .replace(/\{\{lastName\}\}/g, lastName || '')
               .replace(/\{\{fullName\}\}/g, fullName)
               .replace(/\{\{email\}\}/g, email);

    // Get from email from environment or use default
    const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || 'welcome@شجرتي.com';
    
    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: subject,
      html: body,
    });

    console.log('[Welcome Email] Email sent successfully:', emailResponse);

    // Log the email send
    await supabase
      .from('email_logs')
      .insert({
        recipient_email: email,
        recipient_name: fullName,
        subject: subject,
        body: body,
        template_key: 'welcome',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Welcome Email] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send welcome email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});