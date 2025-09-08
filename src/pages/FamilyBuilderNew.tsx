import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableDropdown } from "@/components/SearchableDropdown";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Upload, Users, ArrowRight, Save, Plus, Search, X, TreePine, ArrowLeft, UserIcon, UserRoundIcon, Edit, Edit2, Trash2, Heart, User, Baby, Crown, MapPin, FileText, Camera, Clock, Skull, Bell, Settings, LogOut, UserPlus, UploadCloud, Crop, Star, Sparkles, Image, Store, MoreVertical, Menu, ChevronsUpDown, Check, ChevronDown, Shield, AlertTriangle, UserCircle, Zap, Calendar as CalendarDays, UsersIcon, Activity, Share2, Link2, Eye, Copy, Download, Lock, Globe, Link, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDatabase, parseDateFromDatabase } from "@/lib/dateUtils";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooterSimplified } from "@/components/GlobalFooterSimplified";
import { SmartSearchBar } from "@/components/SmartSearchBar";
import { DateDisplay } from "@/components/DateDisplay";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import Cropper from "react-easy-crop";
import { useIsMobile } from "@/hooks/use-mobile";
import { SpouseForm, SpouseData } from "@/components/SpouseForm";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import FamilyBuilderNewSkeleton from "@/components/skeletons/FamilyBuilderNewSkeleton";
import MemberProfileSkeleton from "@/components/skeletons/MemberProfileSkeleton";
import { MemberProfileView } from "@/components/MemberProfileView";

const FamilyBuilderNew: React.FC = () => {
  // State declarations
  const [formMode, setFormMode] = useState<'view' | 'add' | 'edit' | 'profile' | 'tree-settings'>('view');
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Hooks
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const familyId = searchParams.get('family');

  // Mock functions - replace with your actual implementations
  const handleEditMember = (member: any) => {
    setEditingMember(member);
    setFormMode('edit');
  };

  const handleViewMember = (member: any) => {
    setEditingMember(member);
    setFormMode('profile');
  };

  const handleDeleteMember = (member: any) => {
    // Implementation
  };

  const checkIfMemberIsSpouse = (member: any) => {
    return false; // Replace with actual logic
  };

  const handleSpouseEditWarning = (member: any) => {
    // Implementation
  };

  const handleSpouseDeleteWarning = (member: any) => {
    // Implementation
  };

  const fetchMemberProfile = async (memberId: string) => {
    setProfileLoading(true);
    // Fetch logic here
    setProfileLoading(false);
  };

  const populateFormData = (member: any) => {
    // Implementation
  };

  // Calculate generations count
  const generationCount = useMemo(() => {
    // Mock calculation
    return 4;
  }, [familyMembers]);

  // Render the family overview section
  const renderFamilyOverview = () => (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-card/30 to-accent/10">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
        <div className="flex items-center justify-between p-4">
          {/* Settings & Menu */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              <div className="relative bg-card rounded-lg p-2 border border-border/50">
                <Button variant="ghost" size="sm" onClick={() => setFormMode('tree-settings')}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Navigation Icons */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hidden">
            <div className="flex items-center gap-2 px-2">
              <Button variant="default" size="sm" className="rounded-full bg-primary text-primary-foreground shadow-lg">
                <Users className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-xs">نظرة عامة</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10" onClick={() => navigate(`/family-tree-view?family=${familyId}`)}>
                <TreePine className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-xs">الشجرة</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10" onClick={() => navigate('/store')}>
                <Store className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-xs">المتجر</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10" onClick={() => navigate(`/family-statistics?family=${familyId}`)}>
                <Star className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline text-xs">الإحصائيات</span>
              </Button>
            </div>
          </div>
          
          {/* Profile/Status */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-tl from-secondary/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-accent/5 to-primary/5 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10 px-6 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Family Logo & Name */}
            <div className="space-y-6">
              {/* Floating Logo */}
              <div className="relative inline-block">
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary via-accent to-secondary rounded-full blur opacity-20 group-hover:opacity-30 transition-all duration-500 animate-pulse"></div>
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-card via-card/90 to-card/80 rounded-full border-4 border-primary/20 shadow-2xl backdrop-blur-md group-hover:scale-105 transition-all duration-500">
                    <div className="absolute inset-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-xl">
                      <TreePine className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-primary-foreground" />
                    </div>
                    {/* Rotating border */}
                    <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin" style={{animationDuration: '20s'}}></div>
                  </div>
                </div>
              </div>
              
              {/* Family Name with Creative Typography */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="inline-block bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in">
                    عائلة
                  </span>
                  <br />
                  <span className="inline-block bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent text-5xl sm:text-7xl lg:text-8xl font-black animate-fade-in delay-200">
                    {familyData?.name || 'غير محدد'}
                  </span>
                </h1>
                
                {/* Artistic Separator */}
                <div className="flex items-center justify-center space-x-2 pt-4">
                  <div className="h-1 w-12 bg-gradient-to-r from-transparent via-primary to-primary/50 rounded-full animate-fade-in delay-300"></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full animate-bounce delay-400"></div>
                  <div className="h-2 w-24 bg-gradient-to-r from-primary via-accent to-secondary rounded-full animate-fade-in delay-100"></div>
                  <div className="w-3 h-3 bg-gradient-to-r from-secondary to-accent rounded-full animate-bounce delay-500"></div>
                  <div className="h-1 w-12 bg-gradient-to-r from-secondary/50 via-secondary to-transparent rounded-full animate-fade-in delay-300"></div>
                </div>
              </div>
              
              {/* Family Description Card */}
              {familyData?.description && (
                <div className="max-w-2xl mx-auto animate-fade-in delay-600">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-card/30 to-secondary/20 rounded-3xl blur group-hover:blur-md transition-all duration-300"></div>
                    <div className="relative bg-card/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-border/30 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
                      <div className="absolute top-4 right-4 w-6 h-6 bg-gradient-to-r from-primary to-secondary rounded-full opacity-20"></div>
                      <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed font-medium">
                        {familyData.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Total Members */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-emerald-50 via-card to-emerald-50/50 dark:from-emerald-900/20 dark:via-card dark:to-emerald-800/20 rounded-2xl p-4 sm:p-6 border border-emerald-200/50 dark:border-emerald-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                    {familyMembers.length}
                  </div>
                  <div className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">إجمالي الأعضاء</div>
                </div>
              </div>
            </div>

            {/* Generations */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-amber-50 via-card to-amber-50/50 dark:from-amber-900/20 dark:via-card dark:to-amber-800/20 rounded-2xl p-4 sm:p-6 border border-amber-200/50 dark:border-amber-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse delay-100"></div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-bold text-amber-700 dark:text-amber-300">
                    {generationCount}
                  </div>
                  <div className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium">الأجيال</div>
                </div>
              </div>
            </div>

            {/* Males */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-blue-50 via-card to-blue-50/50 dark:from-blue-900/20 dark:via-card dark:to-blue-800/20 rounded-2xl p-4 sm:p-6 border border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <UserIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-700 dark:text-blue-300">
                    {familyMembers.filter(m => m.gender === 'male').length}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">الذكور</div>
                </div>
              </div>
            </div>

            {/* Females */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-pink-50 via-card to-pink-50/50 dark:from-pink-900/20 dark:via-card dark:to-pink-800/20 rounded-2xl p-4 sm:p-6 border border-pink-200/50 dark:border-pink-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <UserRoundIcon className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-300"></div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-bold text-pink-700 dark:text-pink-300">
                    {familyMembers.filter(m => m.gender === 'female').length}
                  </div>
                  <div className="text-xs sm:text-sm text-pink-600 dark:text-pink-400 font-medium">الإناث</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-4">اختر إجراءً للبدء</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="outline" className="flex items-center gap-2 h-12" onClick={() => setFormMode('add')}>
                <UserPlus className="h-4 w-4" />
                إضافة عضو جديد
              </Button>
              <Button variant="outline" className="flex items-center gap-2 h-12" onClick={() => navigate(`/family-tree-view?family=${familyId}`)}>
                <TreePine className="h-4 w-4" />
                عرض شجرة العائلة
              </Button>
            </div>
          </div>

          {/* Last Updated Info */}
          {familyData?.updated_at && (
            <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                <Clock className="h-3 w-3" />
                آخر تحديث: {format(new Date(familyData.updated_at), 'd MMMM yyyy', {
                  locale: ar
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Main render function with proper conditional structure
  const renderMainContent = () => {
    switch (formMode) {
      case 'view':
        return renderFamilyOverview();
      
      case 'profile':
        return profileLoading ? (
          <MemberProfileSkeleton />
        ) : (
          <MemberProfileView 
            member={editingMember} 
            isSpouse={checkIfMemberIsSpouse(editingMember)} 
            onEdit={() => {
              setFormMode('edit');
              populateFormData(editingMember);
            }} 
            onBack={() => setFormMode('view')} 
            onDelete={() => handleDeleteMember(editingMember)} 
            familyMembers={familyMembers} 
            marriages={[]} 
            onSpouseEditWarning={() => handleSpouseEditWarning(editingMember)} 
            onSpouseDeleteWarning={() => handleSpouseDeleteWarning(editingMember)} 
            onMemberClick={async (member) => {
              setEditingMember(member);
              setFormMode('profile');
              await fetchMemberProfile(member.id);
            }} 
          />
        );
      
      case 'tree-settings':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">إعدادات الشجرة</h2>
            <Button onClick={() => setFormMode('view')}>العودة</Button>
          </div>
        );
      
      case 'add':
      case 'edit':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {formMode === 'add' ? 'إضافة عضو جديد' : 'تعديل العضو'}
            </h2>
            <Button onClick={() => setFormMode('view')}>العودة</Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return <FamilyBuilderNewSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 pt-2 pb-6">
        <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-12")}>
          {/* Form Panel - Right Side on Desktop */}
          <div className={cn("space-y-6", isMobile ? "order-2" : "col-span-8 order-2")}>
            <Card className="h-fit relative bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-white/30 dark:border-gray-600/30 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-500/10 dark:to-gray-500/5 rounded-lg"></div>
              <CardContent className="relative p-2 sm:p-4 md:p-6 overflow-hidden bg-white">
                {renderMainContent()}
              </CardContent>
            </Card>
          </div>

          {/* Member List - Left Side on Desktop */}
          <div className={cn("space-y-4", isMobile ? "order-1" : "col-span-4 order-1")}>
            <div className="p-4 bg-card rounded-lg border">
              <h3 className="font-semibold mb-2">قائمة الأعضاء</h3>
              <p className="text-sm text-muted-foreground">سيتم عرض قائمة الأعضاء هنا</p>
            </div>
          </div>
        </div>
      </div>
      
      <GlobalFooterSimplified />
    </div>
  );
};

export default FamilyBuilderNew;