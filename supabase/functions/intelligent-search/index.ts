import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting intelligent search function...');
    
    const { query, familyId, filters } = await req.json();
    console.log('Search query:', query, 'Family ID:', familyId);

    if (!query || !familyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: query or familyId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Verify user authentication and family access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extract and verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if user has access to the requested family
    const { data: familyAccess, error: accessError } = await supabase
      .rpc('get_user_family_ids', { user_uuid: user.id });
    
    if (accessError) {
      console.error('Family access check error:', accessError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify family access' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const userFamilyIds = familyAccess?.map((f: any) => f.family_id) || [];
    
    if (!userFamilyIds.includes(familyId)) {
      console.log('Access denied: User does not have access to family', familyId);
      return new Response(
        JSON.stringify({ error: 'Access denied: You do not have permission to search this family' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    console.log('Authorization successful for user:', user.id, 'family:', familyId);
    
    // احصل على رأس التصريح من الطلب - Note: setAuth is deprecated in newer Supabase versions
    // Authentication will be handled automatically by the client with proper headers

    // إنشاء embedding للاستعلام
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to create embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // البحث باستخدام الـ similarity search
    let searchQuery = supabase
      .from('search_embeddings')
      .select(`
        *,
        family_tree_members!family_member_id (
          id,
          name,
          birth_date,
          death_date,
          gender,
          is_alive,
          biography
        )
      `);

    // إضافة فلاتر إضافية
    if (filters?.gender) {
      searchQuery = searchQuery.eq('family_tree_members.gender', filters.gender);
    }
    if (filters?.isAlive !== undefined) {
      searchQuery = searchQuery.eq('family_tree_members.is_alive', filters.isAlive);
    }

    const { data: searchResults, error: searchError } = await searchQuery.limit(20);

    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    // حساب التشابه وترتيب النتائج
    const resultsWithSimilarity = searchResults?.map(result => {
      if (!result.embedding) return { ...result, similarity: 0 };
      
      const similarity = cosineSimilarity(queryEmbedding, result.embedding);
      return { ...result, similarity };
    }).sort((a, b) => b.similarity - a.similarity);

    // البحث النصي التقليدي كبديل
    const { data: textSearchResults, error: textError } = await supabase
      .from('family_tree_members')
      .select('*')
      .eq('family_id', familyId)
      .or(`name.ilike.%${query}%, biography.ilike.%${query}%`)
      .limit(10);

    if (textError) {
      console.error('Text search error:', textError);
    }

    // دمج النتائج وإزالة المكررات
    const combinedResults = [
      ...(resultsWithSimilarity || []).map(r => r.family_tree_members),
      ...(textSearchResults || [])
    ].filter((member, index, self) => 
      member && self.findIndex(m => m?.id === member.id) === index
    );

    console.log('Found results:', combinedResults.length);

    return new Response(
      JSON.stringify({ 
        results: combinedResults,
        total: combinedResults.length,
        searchType: 'intelligent'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in intelligent search:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? (error as Error).message : 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// دالة لحساب cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}