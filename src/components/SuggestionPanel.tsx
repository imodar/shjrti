import React, { useState, useEffect } from 'react';
import { Lightbulb, Check, X, AlertCircle, Users, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Suggestion {
  id: string;
  suggestion_type: string;
  suggestion_data: any;
  confidence_score: number;
  status: string;
  created_at: string;
}

interface SuggestionPanelProps {
  familyId: string;
  className?: string;
}

export const SuggestionPanel: React.FC<SuggestionPanelProps> = ({
  familyId,
  className = ""
}) => {
  const { user } = useCurrentUser();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (familyId && user?.id) {
      loadSuggestions();
    }
  }, [familyId, user?.id]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      console.log('Loading suggestions for family:', familyId);

      // تحميل الاقتراحات الموجودة
      const { data: existingSuggestions, error: loadError } = await supabase
        .from('smart_suggestions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (loadError) {
        console.error('Error loading suggestions:', loadError);
      } else {
        setSuggestions(existingSuggestions || []);
      }

      // توليد اقتراحات جديدة
      const { data: newSuggestions, error: generateError } = await supabase.functions.invoke('smart-suggestions', {
        body: {
          familyId,
          action: 'get_suggestions'
        }
      });

      if (generateError) {
        console.error('Error generating suggestions:', generateError);
        toast({
          title: "تنبيه",
          description: "لم نتمكن من توليد اقتراحات جديدة. سيتم عرض الاقتراحات الموجودة.",
          variant: "default"
        });
      } else {
        // حفظ الاقتراحات الجديدة في قاعدة البيانات
        if (newSuggestions?.suggestions?.length > 0) {
          const suggestionsToSave = newSuggestions.suggestions.map((suggestion: any) => ({
            user_id: user?.id,
            family_member_id: suggestion.suggestion_data?.member_id,
            suggestion_type: suggestion.suggestion_type,
            suggestion_data: suggestion.suggestion_data,
            confidence_score: suggestion.confidence_score,
            status: 'pending'
          }));

          const { data: savedSuggestions, error: saveError } = await supabase
            .from('smart_suggestions')
            .insert(suggestionsToSave)
            .select();

          if (saveError) {
            console.error('Error saving suggestions:', saveError);
          } else {
            setSuggestions(prev => [...(savedSuggestions || []), ...prev]);
          }
        }
      }
    } catch (error) {
      console.error('Error in loadSuggestions:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل الاقتراحات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionAction = async (suggestionId: string, action: 'accepted' | 'rejected' | 'dismissed') => {
    try {
      setActionLoading(suggestionId);

      const { error } = await supabase
        .from('smart_suggestions')
        .update({ status: action })
        .eq('id', suggestionId);

      if (error) {
        console.error('Error updating suggestion:', error);
        toast({
          title: "خطأ",
          description: "فشل في تحديث الاقتراح",
          variant: "destructive"
        });
        return;
      }

      // إزالة الاقتراح من القائمة
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));

      toast({
        title: "تم التحديث",
        description: action === 'accepted' ? "تم قبول الاقتراح" : "تم رفض الاقتراح",
        variant: "default"
      });
    } catch (error) {
      console.error('Error handling suggestion action:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة الاقتراح",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'missing_info':
        return <Info className="h-4 w-4" />;
      case 'relationship':
        return <Users className="h-4 w-4" />;
      case 'date_estimate':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'missing_info':
        return 'معلومات ناقصة';
      case 'relationship':
        return 'علاقة عائلية';
      case 'date_estimate':
        return 'تقدير تاريخ';
      case 'name_variant':
        return 'تصحيح اسم';
      default:
        return 'اقتراح';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            الاقتراحات الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-accent/50 rounded-lg animate-pulse">
                <div className="h-4 bg-accent rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-accent rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            الاقتراحات الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              لا توجد اقتراحات جديدة في الوقت الحالي
            </p>
            <Button 
              variant="outline" 
              onClick={loadSuggestions}
              className="mt-4"
            >
              إعادة التحقق
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          الاقتراحات الذكية
          <Badge variant="secondary">{suggestions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-4 bg-accent/30 rounded-lg border border-border/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getSuggestionIcon(suggestion.suggestion_type)}
                  <Badge variant="outline">
                    {getSuggestionTypeLabel(suggestion.suggestion_type)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getConfidenceColor(suggestion.confidence_score)}`}></div>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(suggestion.confidence_score * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                {suggestion.suggestion_data?.member_name && (
                  <p className="font-medium text-foreground mb-1">
                    {suggestion.suggestion_data.member_name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {suggestion.suggestion_data?.suggestion_text || 
                   suggestion.suggestion_data?.description ||
                   'اقتراح تحسين'}
                </p>
                
                {suggestion.suggestion_data?.reasoning && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    السبب: {suggestion.suggestion_data.reasoning}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSuggestionAction(suggestion.id, 'accepted')}
                  disabled={actionLoading === suggestion.id}
                  className="flex-1"
                >
                  <Check className="h-3 w-3 mr-1" />
                  قبول
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionAction(suggestion.id, 'dismissed')}
                  disabled={actionLoading === suggestion.id}
                  className="flex-1"
                >
                  <X className="h-3 w-3 mr-1" />
                  تجاهل
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <Button 
            variant="outline" 
            onClick={loadSuggestions}
            disabled={loading}
            className="w-full"
          >
            تحديث الاقتراحات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};