import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Calendar, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  name: string;
  birth_date?: string;
  death_date?: string;
  gender?: string;
  is_alive?: boolean;
  biography?: string;
}

interface SmartSearchBarProps {
  familyId: string;
  onResultSelect?: (member: SearchResult) => void;
  placeholder?: string;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  familyId,
  onResultSelect,
  placeholder = "ابحث عن أفراد العائلة... (مثال: ابن عم أحمد من ناحية الأب)"
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    isAlive: '',
    hasPhoto: ''
  });
  const { toast } = useToast();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !familyId) return;

    setLoading(true);
    try {
      console.log('Performing intelligent search for:', searchQuery);

      // استدعاء Edge Function للبحث الذكي
      const { data, error } = await supabase.functions.invoke('intelligent-search', {
        body: {
          query: searchQuery,
          familyId,
          filters: {
            gender: filters.gender || undefined,
            isAlive: filters.isAlive ? filters.isAlive === 'true' : undefined
          }
        }
      });

      if (error) {
        console.error('Search error:', error);
        // فال باك للبحث التقليدي
        await performFallbackSearch(searchQuery);
      } else {
        console.log('Search results:', data.results);
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // فال باك للبحث التقليدي
      await performFallbackSearch(searchQuery);
    } finally {
      setLoading(false);
    }
  };

  const performFallbackSearch = async (searchQuery: string) => {
    try {
      console.log('Performing fallback search...');
      
      let query = supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', familyId)
        .or(`name.ilike.%${searchQuery}%, biography.ilike.%${searchQuery}%`);

      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters.isAlive) {
        query = query.eq('is_alive', filters.isAlive === 'true');
      }

      const { data, error } = await query.limit(10);

      if (error) {
        console.error('Fallback search error:', error);
        toast({
          title: "خطأ في البحث",
          description: "حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
        return;
      }

      setResults(data || []);
    } catch (error) {
      console.error('Fallback search failed:', error);
      toast({
        title: "خطأ في البحث",
        description: "فشل في تنفيذ البحث. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  // تنفيذ البحث عند تغيير الاستعلام
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, filters, familyId]);

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    setQuery('');
    setResults([]);
  };

  const clearFilters = () => {
    setFilters({
      gender: '',
      isAlive: '',
      hasPhoto: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  return (
    <div className="relative w-full">
      <Card className="bg-background/95 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="pl-10 pr-4"
                disabled={loading}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? 'border-primary bg-primary/10' : ''}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* الفلاتر */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    الجنس
                  </label>
                  <Select value={filters.gender} onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع الأجناس</SelectItem>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    الحالة
                  </label>
                  <Select value={filters.isAlive} onValueChange={(value) => setFilters(prev => ({ ...prev, isAlive: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">الكل</SelectItem>
                      <SelectItem value="true">على قيد الحياة</SelectItem>
                      <SelectItem value="false">متوفى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      مسح الفلاتر
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* النتائج */}
      {results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto bg-background/95 backdrop-blur-sm border-border/50">
          <CardContent className="p-2">
            <div className="space-y-1">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {result.name}
                      </h4>
                      
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {result.birth_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(result.birth_date).getFullYear()}</span>
                          </div>
                        )}
                        
                        {result.gender && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{result.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                          </div>
                        )}
                      </div>

                      {result.biography && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {result.biography}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {result.is_alive !== undefined && (
                        <Badge variant={result.is_alive ? "default" : "secondary"}>
                          {result.is_alive ? 'على قيد الحياة' : 'متوفى'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* رسالة عدم وجود نتائج */}
      {query.trim() && !loading && results.length === 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 bg-background/95 backdrop-blur-sm border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">لم يتم العثور على نتائج للبحث "{query}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};