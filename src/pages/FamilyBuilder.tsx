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
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { ModernFamilyMemberModal } from "@/components/ModernFamilyMemberModal";
import Cropper from "react-easy-crop";

interface FamilyMember {
  id: string;
  name: string;
  arabicName?: string;
  gender: "male" | "female";
  birthDate?: Date;
  deathDate?: Date;
  birthLocation?: string;
  currentLocation?: string;
  occupation?: string;
  education?: string;
  biography?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  photoUrl?: string;
  isFounder?: boolean;
}

const FamilyBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { loading } = useDashboardData();

  // State management
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Load family data on component mount
  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('family_tree_members')
        .select('*');

      if (error) throw error;

      const members: FamilyMember[] = (data || []).map((member: any) => ({
        id: member.id,
        name: member.name,
        arabicName: member.arabic_name,
        gender: member.gender,
        birthDate: member.birth_date ? new Date(member.birth_date) : undefined,
        deathDate: member.death_date ? new Date(member.death_date) : undefined,
        birthLocation: member.birth_location,
        currentLocation: member.current_location,
        occupation: member.occupation,
        education: member.education,
        biography: member.biography,
        fatherId: member.father_id,
        motherId: member.mother_id,
        spouseId: member.spouse_id,
        photoUrl: member.photo_url,
        isFounder: member.is_founder
      }));
      setFamilyMembers(members);
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  // Filter members based on search term
  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.arabicName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle saving member from modal
  const handleSaveMemberFromModal = async (memberData: any) => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .upsert({
          id: memberData.id || undefined,
          name: memberData.name,
          arabic_name: memberData.arabicName,
          gender: memberData.gender,
          birth_date: memberData.birthDate?.toISOString(),
          death_date: memberData.deathDate?.toISOString(),
          birth_location: memberData.birthLocation,
          current_location: memberData.currentLocation,
          occupation: memberData.occupation,
          education: memberData.education,
          biography: memberData.biography,
          father_id: memberData.fatherId,
          mother_id: memberData.motherId,
          spouse_id: memberData.spouseId,
          photo_url: memberData.photoUrl,
          is_founder: memberData.isFounder
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (memberData.id) {
        setFamilyMembers(prev => prev.map(m => m.id === memberData.id ? memberData : m));
      } else {
        setFamilyMembers(prev => [...prev, { ...memberData, id: data.id }]);
      }

      setIsModalOpen(false);
      setEditingMember(null);
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ بيانات العضو بنجاح"
      });
    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive"
      });
    }
  };

  // Handle crop complete
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle crop save
  const handleCropSave = async () => {
    // Implementation for crop save
    setShowImageCrop(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                العودة للوحة التحكم
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">بناء شجرة العائلة</h1>
                <p className="text-muted-foreground">أضف وإدارة أفراد العائلة</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingMember(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="h-4 w-4" />
              إضافة عضو جديد
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث عن أفراد العائلة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Family Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={member.photoUrl} />
                      <AvatarFallback>
                        {member.gender === "male" ? <User className="h-8 w-8" /> : <UserIcon className="h-8 w-8" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      {member.arabicName && (
                        <p className="text-sm text-muted-foreground">{member.arabicName}</p>
                      )}
                      {member.birthDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(member.birthDate, "yyyy", { locale: ar })}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingMember(member);
                          setIsModalOpen(true);
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        تعديل
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">لا توجد أفراد عائلة</h3>
              <p className="text-muted-foreground mb-4">ابدأ ببناء شجرة عائلتك بإضافة أول عضو</p>
              <Button
                onClick={() => {
                  setEditingMember(null);
                  setIsModalOpen(true);
                }}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة عضو جديد
              </Button>
            </div>
          )}
        </div>
      </div>

      <GlobalFooter />

      {/* Modern Family Member Modal */}
      <ModernFamilyMemberModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMember(null);
        }}
        onSubmit={handleSaveMemberFromModal}
        familyId="default"
      />

      {/* Image Crop Modal */}
      <Dialog open={showImageCrop} onOpenChange={setShowImageCrop}>
        <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">قص الصورة</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              اضبط الصورة كما تريد وانقر على حفظ
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-96 w-full">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowImageCrop(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCropSave} className="bg-gradient-to-r from-primary to-primary/80">
              حفظ الصورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyBuilder;