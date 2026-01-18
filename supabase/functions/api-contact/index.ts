import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === "POST") {
      const body = await req.json();
      const { full_name, email, description } = body;

      // Validate required fields
      if (!full_name || !email || !description) {
        return errorResponse("Missing required fields: full_name, email, description", 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse("Invalid email format", 400);
      }

      // Validate minimum lengths
      if (full_name.trim().length < 2) {
        return errorResponse("Name must be at least 2 characters", 400);
      }

      if (description.trim().length < 10) {
        return errorResponse("Description must be at least 10 characters", 400);
      }

      // Insert contact submission
      const { data, error } = await supabase
        .from("contact_submissions")
        .insert({
          full_name: full_name.trim(),
          email: email.trim().toLowerCase(),
          description: description.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting contact submission:", error);
        return errorResponse("Failed to submit contact form", 500);
      }

      return successResponse({ success: true, id: data.id }, 201);
    }

    return errorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Contact API error:", error);
    return errorResponse("Internal server error", 500);
  }
});
