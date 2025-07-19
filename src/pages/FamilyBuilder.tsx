import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image, Store, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { GlobalFooter } from "@/components/GlobalFooter";
import { GlobalHeader } from "@/components/GlobalHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const FamilyBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { notifications, profile } = useDashboardData();
  
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch family data from database
  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get user's families
        const { data: families, error: familiesError } = await supabase
          .from('families')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (familiesError) throw familiesError;

        if (families && families.length > 0) {
          const family = families[0]; // Use most recent family
          setFamilyData(family);
          
          // Get family members
          const { data: members, error: membersError } = await supabase
            .from('family_tree_members')
            .select('*')
            .eq('family_id', family.id);

          if (membersError) throw membersError;

          if (members) {
            const transformedMembers = members.map(member => ({
              id: member.id,
              name: member.name,
              fatherId: member.father_id,
              motherId: member.mother_id,
              spouseId: member.spouse_id,
              relatedPersonId: member.related_person_id,
              isFounder: member.is_founder,
              gender: member.gender || 'male',
              birthDate: member.birth_date || '',
              isAlive: member.is_alive,
              deathDate: member.death_date || null,
              image: member.image_url || null,
              bio: member.biography || '',
              relation: ""
            }));
            
            setFamilyMembers(transformedMembers);
          }
        }
      } catch (error) {
        console.error('Error fetching family data:', error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "حدث خطأ أثناء تحميل بيانات العائلة",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, [toast]);

  if (loading) {
    return (
      <>
        <GlobalHeader />
        <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 flex items-center justify-center pt-20">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">جاري تحميل بيانات العائلة...</p>
          </div>
        </div>
        <GlobalFooter />
      </>
    );
  }

  return (
    <>
      <GlobalHeader />
      
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/20 dark:from-gray-900 dark:via-emerald-900/10 dark:to-teal-900/10 pt-20">
        {/* Luxury Floating Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-32 left-10 w-64 h-64 bg-gradient-to-br from-emerald-400/10 via-teal-400/8 to-cyan-400/5 rounded-full blur-3xl animate-float opacity-60"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-tr from-cyan-400/8 via-teal-400/10 to-emerald-400/5 rounded-full blur-2xl animate-float-delayed opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-400/5 via-emerald-400/8 to-cyan-400/3 rounded-full blur-3xl animate-float-slow opacity-30"></div>
        </div>

        {/* Enhanced Page Header Box from Family Creator */}
        <div className="mb-8">
          <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-white/40 dark:border-gray-600/40 rounded-2xl py-4 px-6 shadow-2xl ring-1 ring-white/20 dark:ring-gray-500/20">
            <div className="flex items-center justify-between gap-8">
              {/* Right Side: Icon + Title + Description */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-500 rounded-xl flex items-center justify-center shadow-xl border-2 border-white/30 dark:border-gray-700/30">
                    <Users className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  </div>
                </div>
                
                {/* Text Content */}
                <div className="text-right">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                      إدارة أفراد العائلة
                    </span>
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                    أضف وعدل أفراد شجرة العائلة وتحديد العلاقات بينهم
                  </p>
                  {familyData && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700/50 dark:text-emerald-300">
                        <TreePine className="h-3 w-3 mr-1" />
                        {familyData.name}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Left Side: Action Buttons */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl px-6"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  العودة للوحة التحكم
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="container mx-auto px-6 pb-16">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                بناء شجرة العائلة
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                ابدأ ببناء شجرة عائلتك بإضافة أفراد العائلة وتحديد العلاقات بينهم
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {familyMembers.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">لا توجد أفراد في العائلة بعد</h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                    ابدأ ببناء شجرة عائلتك بإضافة أول فرد من العائلة
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl px-8 py-3"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    إضافة أول فرد
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyMembers.map((member) => (
                    <Card key={member.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.image} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              {member.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{member.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{member.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={member.isAlive ? 'default' : 'secondary'} className="text-xs">
                                {member.isAlive ? 'على قيد الحياة' : 'متوفى'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <GlobalFooter />
    </>
  );
};

export default FamilyBuilder;