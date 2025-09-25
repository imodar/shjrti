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
    console.log('Starting smart suggestions function...');
    
    const { familyId, memberId, action } = await req.json();
    console.log('Input:', { familyId, memberId, action });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // احصل على رأس التصريح من الطلب
    // Authentication headers are handled automatically by the Supabase client

    // احصل على بيانات العائلة
    const { data: familyMembers, error: membersError } = await supabase
      .from('family_tree_members')
      .select('*')
      .eq('family_id', familyId);

    if (membersError) {
      console.error('Error fetching family members:', membersError);
      throw membersError;
    }

    let suggestions: any[] = [];

    if (action === 'get_suggestions') {
      // توليد اقتراحات ذكية
      suggestions = await generateIntelligentSuggestions(familyMembers, memberId, openaiApiKey);
    } else if (action === 'update_status') {
      // تحديث حالة اقتراح معين
      const { suggestionId, status } = await req.json();
      const { data: updatedSuggestion, error: updateError } = await supabase
        .from('smart_suggestions')
        .update({ status })
        .eq('id', suggestionId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating suggestion:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, suggestion: updatedSuggestion }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generated suggestions:', suggestions.length);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in smart suggestions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function generateIntelligentSuggestions(familyMembers: any[], memberId: string | null, openaiApiKey: string) {
  const suggestions = [];

  // اقتراحات للمعلومات الناقصة
  const missingInfoSuggestions = await generateMissingInfoSuggestions(familyMembers);
  suggestions.push(...missingInfoSuggestions);

  // اقتراحات العلاقات المحتملة
  const relationshipSuggestions = await generateRelationshipSuggestions(familyMembers, openaiApiKey);
  suggestions.push(...relationshipSuggestions);

  // اقتراحات تقدير التواريخ
  const dateSuggestions = await generateDateEstimates(familyMembers);
  suggestions.push(...dateSuggestions);

  return suggestions;
}

async function generateMissingInfoSuggestions(familyMembers: any[]) {
  const suggestions = [];

  for (const member of familyMembers) {
    const missingSuggestions = [];

    if (!member.birth_date) {
      missingSuggestions.push({
        type: 'missing_info',
        field: 'birth_date',
        suggestion: 'إضافة تاريخ الميلاد',
        confidence: 0.8
      });
    }

    if (!member.biography) {
      missingSuggestions.push({
        type: 'missing_info',
        field: 'biography',
        suggestion: 'إضافة السيرة الذاتية',
        confidence: 0.6
      });
    }

    if (!member.father_id && !member.is_founder) {
      missingSuggestions.push({
        type: 'missing_info',
        field: 'father_id',
        suggestion: 'ربط بالأب',
        confidence: 0.7
      });
    }

    for (const suggestion of missingSuggestions) {
      suggestions.push({
        suggestion_type: suggestion.type,
        suggestion_data: {
          member_id: member.id,
          member_name: member.name,
          field: suggestion.field,
          suggestion_text: suggestion.suggestion
        },
        confidence_score: suggestion.confidence
      });
    }
  }

  return suggestions;
}

async function generateRelationshipSuggestions(familyMembers: any[], openaiApiKey: string) {
  const suggestions = [];

  // البحث عن أنماط في الأسماء
  const namePatterns = findNamePatterns(familyMembers);
  
  for (const pattern of namePatterns) {
    if (pattern.confidence > 0.6) {
      suggestions.push({
        suggestion_type: 'relationship',
        suggestion_data: {
          member_ids: pattern.members,
          relationship_type: pattern.type,
          suggestion_text: pattern.description,
          evidence: pattern.evidence
        },
        confidence_score: pattern.confidence
      });
    }
  }

  return suggestions;
}

async function generateDateEstimates(familyMembers: any[]) {
  const suggestions = [];

  for (const member of familyMembers) {
    if (!member.birth_date) {
      // تقدير التاريخ بناءً على الأقارب
      const estimatedDate = estimateBirthDate(member, familyMembers);
      
      if (estimatedDate) {
        suggestions.push({
          suggestion_type: 'date_estimate',
          suggestion_data: {
            member_id: member.id,
            member_name: member.name,
            estimated_birth_date: estimatedDate.date,
            reasoning: estimatedDate.reasoning,
            suggestion_text: `تقدير تاريخ الميلاد: ${estimatedDate.date}`
          },
          confidence_score: estimatedDate.confidence
        });
      }
    }
  }

  return suggestions;
}

function findNamePatterns(familyMembers: any[]) {
  const patterns = [];
  
  // البحث عن الأسماء المتشابهة
  for (let i = 0; i < familyMembers.length; i++) {
    for (let j = i + 1; j < familyMembers.length; j++) {
      const member1 = familyMembers[i];
      const member2 = familyMembers[j];
      
      const similarity = calculateNameSimilarity(member1.name, member2.name);
      
      if (similarity > 0.7) {
        patterns.push({
          members: [member1.id, member2.id],
          type: 'potential_relatives',
          description: `${member1.name} و ${member2.name} قد يكونان من نفس العائلة`,
          evidence: [`تشابه في الأسماء: ${similarity.toFixed(2)}`],
          confidence: similarity * 0.8
        });
      }
    }
  }

  return patterns;
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const words1 = name1.toLowerCase().split(/\s+/);
  const words2 = name2.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2) {
        matchCount++;
        break;
      }
    }
  }
  
  return matchCount / Math.max(words1.length, words2.length);
}

function estimateBirthDate(member: any, familyMembers: any[]) {
  // البحث عن الأب والأم
  const father = familyMembers.find(m => m.id === member.father_id);
  const mother = familyMembers.find(m => m.id === member.mother_id);
  
  if (father?.birth_date) {
    const fatherBirthYear = new Date(father.birth_date).getFullYear();
    const estimatedYear = fatherBirthYear + 25; // متوسط عمر الإنجاب
    
    return {
      date: `${estimatedYear}-01-01`,
      reasoning: `تقدير بناءً على تاريخ ميلاد الأب (${father.name})`,
      confidence: 0.6
    };
  }
  
  if (mother?.birth_date) {
    const motherBirthYear = new Date(mother.birth_date).getFullYear();
    const estimatedYear = motherBirthYear + 22; // متوسط عمر الإنجاب للأم
    
    return {
      date: `${estimatedYear}-01-01`,
      reasoning: `تقدير بناءً على تاريخ ميلاد الأم (${mother.name})`,
      confidence: 0.6
    };
  }
  
  return null;
}