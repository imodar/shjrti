import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowRight, ArrowLeft, Heart, UserPlus, CheckCircle, Plus, Upload, X, MoreVertical, Edit, Trash2, Crown, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { StitchHeader } from "@/components/stitch/Header";
import { supabase } from "@/integrations/supabase/client";
import { formatDateForDatabase } from "@/lib/dateUtils";
import WifeForm, { WifeFormRef } from "@/components/WifeForm";
import Cropper from "react-easy-crop";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { useLanguage } from "@/contexts/LanguageContext";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";

const StitchFamilyCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const { isImageUploadEnabled } = useImageUploadPermission();
  const wifeFormRef = useRef<WifeFormRef>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdFamilyId, setCreatedFamilyId] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [editingWife, setEditingWife] = useState<{ id: string; first_name: string; last_name: string; name: string; isAlive: boolean; birthDate: Date | null; deathDate: Date | null; maritalStatus?: string } | null>(null);
  const [isAddingWife, setIsAddingWife] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [treeData, setTreeData] = useState({ name: "", description: "" });

  const [founderData, setFounderData] = useState({
    name: "",
    gender: "male",
    birthDate: null as Date | null,
    isAlive: true,
    deathDate: null as Date | null,
    bio: "",
    image: null as File | null,
    croppedImage: null as string | null
  });

  const [wives, setWives] = useState<Array<{
    id: string; first_name: string; last_name: string; name: string;
    isAlive: boolean; birthDate: Date | null; deathDate: Date | null; maritalStatus: string;
  }>>([]);

  // ─── All business logic copied from FamilyCreator ───

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!treeData.name.trim()) {
        toast({ title: t('error_title', 'خطأ'), description: t('please_enter_family_name', 'يرجى إدخال اسم العائلة'), variant: "destructive" });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!founderData.name.trim() || !founderData.gender) {
        toast({ title: "خطأ", description: "يرجى إكمال جميع البيانات المطلوبة للمؤسس", variant: "destructive" });
        return;
      }
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({ title: "خطأ في المصادقة", description: "يرجى تسجيل الدخول أولاً", variant: "destructive" });
        navigate('/stitch-dashboard');
        return;
      }
      handleCreateFamily();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 1) {
      window.scrollTo(0, 0);
      navigate('/stitch-dashboard');
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const checkFamilyCreationLimits = async (userId: string): Promise<boolean> => {
    try {
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`*, packages (max_family_trees, name)`)
        .eq('user_id', userId).eq('status', 'active').single();

      const getPackageName = (nameData: any) => {
        try {
          const obj = typeof nameData === 'string' ? JSON.parse(nameData) : nameData;
          return obj?.ar || obj?.en || 'الباقة الحالية';
        } catch { return typeof nameData === 'string' ? nameData : 'الباقة الحالية'; }
      };

      if (subscriptionError || !subscription) {
        const { data: defaultPackage, error: packageError } = await supabase
          .from('packages').select('id, max_family_trees, name').eq('is_active', true).order('price', { ascending: true }).limit(1).single();
        if (packageError || !defaultPackage) { toast({ title: "خطأ", description: "لم يتم العثور على باقة متاحة", variant: "destructive" }); return false; }
        const { data: families, error: familiesError } = await supabase
          .from('families').select('id').eq('creator_id', userId).eq('is_archived', false);
        if (familiesError) { toast({ title: "خطأ", description: "حدث خطأ في التحقق من حدود الباقة", variant: "destructive" }); return false; }
        const count = families?.length || 0;
        const max = defaultPackage.max_family_trees || 1;
        if (count >= max) {
          toast({ title: "تم الوصول للحد الأقصى", description: `لقد وصلت للحد الأقصى من أشجار العائلة (${max}) في باقة ${getPackageName(defaultPackage.name)}.`, variant: "destructive" });
          return false;
        }
        return true;
      }

      const { data: families, error: familiesError } = await supabase
        .from('families').select('id').eq('creator_id', userId).eq('is_archived', false);
      if (familiesError) { toast({ title: "خطأ", description: "حدث خطأ في التحقق من حدود الباقة", variant: "destructive" }); return false; }
      const count = families?.length || 0;
      const max = subscription.packages?.max_family_trees || 1;
      if (count >= max) {
        toast({ title: "تم الوصول للحد الأقصى", description: `لقد وصلت للحد الأقصى من أشجار العائلة (${max}) في ${getPackageName(subscription.packages?.name)}.`, variant: "destructive" });
        return false;
      }
      return true;
    } catch { toast({ title: "خطأ", description: "حدث خطأ في التحقق من حدود الباقة", variant: "destructive" }); return false; }
  };

  const creationLockRef = useRef(false);

  const handleCreateFamily = async () => {
    if (creationLockRef.current) return;
    creationLockRef.current = true;
    setIsCreatingFamily(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { toast({ title: "خطأ في المصادقة", description: "يرجى تسجيل الدخول أولاً", variant: "destructive" }); return; }

      const canCreate = await checkFamilyCreationLimits(user.id);
      if (!canCreate) return;

      const { data: family, error: familyError } = await supabase
        .from('families').insert({ name: treeData.name, description: treeData.description, creator_id: user.id }).select().single();

      if (familyError) {
        if (familyError.message?.includes('FAMILY_LIMIT_EXCEEDED')) {
          toast({ title: "تم الوصول للحد الأقصى", description: familyError.message.split(':')[1] || 'تم الوصول للحد الأقصى من الأشجار', variant: "destructive" });
          return;
        }
        throw familyError;
      }

      setCreatedFamilyId(family.id);

      await supabase.from('family_members').insert({ family_id: family.id, user_id: user.id, role: 'creator' });

      const extractFamilyName = (name: string) => name.replace(/^عائلة\s+/, '').trim();
      const cleanFamilyName = extractFamilyName(treeData.name || '');
      const founderName = `${founderData.name || 'مؤسس'} ${cleanFamilyName}`.trim() || 'مؤسس العائلة';

      const { data: founder, error: founderError } = await supabase
        .from('family_tree_members').insert({
          family_id: family.id, name: founderName, first_name: founderData.name, last_name: cleanFamilyName,
          gender: founderData.gender, birth_date: formatDateForDatabase(founderData.birthDate),
          death_date: formatDateForDatabase(founderData.deathDate), is_alive: founderData.isAlive,
          biography: founderData.bio, image_url: founderData.croppedImage, is_founder: true, created_by: user.id
        }).select().single();

      if (founderError) throw founderError;

      for (const wife of wives) {
        const wifeName = wife.name || 'زوجة غير محددة';
        const { data: wifeData, error: wifeError } = await supabase
          .from('family_tree_members').insert({
            family_id: family.id, name: wifeName, first_name: wife.first_name || wife.name || 'زوجة',
            last_name: wife.last_name || cleanFamilyName, gender: 'female',
            marital_status: wife.maritalStatus || 'married',
            birth_date: formatDateForDatabase(wife.birthDate), death_date: formatDateForDatabase(wife.deathDate),
            is_alive: wife.isAlive, created_by: user.id
          }).select().single();
        if (wifeError) throw wifeError;
        await supabase.from('marriages').insert({
          family_id: family.id, husband_id: founder.id, wife_id: wifeData.id,
          marital_status: wife.maritalStatus || 'married', is_active: true
        });
      }

      setShowSuccessModal(true);
      toast({ title: t('family_created_success', 'تم إنشاء العائلة بنجاح'), description: `تم حفظ بيانات العائلة مع ${wives.length} من الزوجات` });
    } catch (error) {
      console.error('Error creating family:', error);
      toast({ title: t('error_creating_family', 'خطأ في إنشاء العائلة'), description: t('error_saving_family', 'حدث خطأ أثناء حفظ بيانات العائلة'), variant: "destructive" });
    } finally {
      setIsCreatingFamily(false);
      creationLockRef.current = false;
    }
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => { setCroppedAreaPixels(croppedAreaPixels); }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = document.createElement('img');
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (e) => reject(e));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => { if (blob) { const reader = new FileReader(); reader.addEventListener('load', () => resolve(reader.result as string)); reader.readAsDataURL(blob); } }, 'image/jpeg', 0.8);
    });
  };

  const handleCropSave = async () => {
    if (cropImage && croppedAreaPixels) {
      try {
        const croppedImageUrl = await getCroppedImg(cropImage, croppedAreaPixels);
        setFounderData({ ...founderData, croppedImage: croppedImageUrl });
        setShowCropModal(false); setCropImage(null); setCrop({ x: 0, y: 0 }); setZoom(1); setCroppedAreaPixels(null);
        toast({ title: "تم حفظ الصورة", description: "تم قص الصورة وحفظها بنجاح" });
      } catch (e) { console.error(e); toast({ title: "خطأ في معالجة الصورة", description: "حدث خطأ أثناء قص الصورة", variant: "destructive" }); }
    }
  };

  const handleAddMoreMembers = () => {
    setShowSuccessModal(false);
    if (createdFamilyId) {
      navigate(`/stitch-family-builder?family=${createdFamilyId}&autoAdd=true`);
    } else {
      toast({ title: "خطأ", description: "لم يتم العثور على معرف العائلة", variant: "destructive" });
    }
  };

  const handleSkipToDashboard = () => {
    setShowSuccessModal(false);
    navigate("/stitch-dashboard");
    toast({ title: "تم إنشاء الشجرة بنجاح", description: "تم إنشاء شجرة العائلة بنجاح، يمكنك إضافة أفراد آخرين لاحقاً" });
  };

  return (
    <div className="theme-stitch min-h-screen bg-background">
      <StitchHeader hideNav variant="account" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Title + Steps */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
              <span className="material-icons-round text-xl">park</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('create_family_tree', 'إنشاء شجرة العائلة')}</h1>
              <p className="text-sm text-muted-foreground">{t('create_tree_description', 'ابدأ رحلتك في بناء تاريخ عائلتك')}</p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-3 mt-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${currentStep >= 1 ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'}`}>
              <span>1</span>
              <span className="hidden sm:inline">{t('family_info', 'معلومات العائلة')}</span>
            </div>
            <div className={`w-8 h-1 rounded-full transition-all ${currentStep >= 2 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${currentStep >= 2 ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'}`}>
              <span>2</span>
              <span className="hidden sm:inline">{t('founder_data', 'بيانات المؤسس')}</span>
            </div>
          </div>
        </div>

        {/* Step 1: Family Info */}
        {currentStep === 1 && (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="h-1 bg-primary" />
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <Label htmlFor="familyName" className="text-sm font-semibold text-foreground mb-2 block">
                  {t('family_name_required', 'اسم العائلة *')}
                </Label>
                <Input
                  id="familyName"
                  placeholder={t('family_name_example', 'مثال : السعيد')}
                  value={treeData.name}
                  onChange={(e) => setTreeData({ ...treeData, name: e.target.value })}
                  className="h-12 rounded-xl border-border focus:border-primary"
                />
              </div>

              <div>
                <Label htmlFor="familyDescription" className="text-sm font-semibold text-foreground mb-2 block">
                  {t('family_description_optional', 'وصف العائلة (اختياري)')}
                </Label>
                <Textarea
                  id="familyDescription"
                  placeholder={t('family_description_placeholder', 'شارك قصة عائلتك...')}
                  value={treeData.description}
                  onChange={(e) => setTreeData({ ...treeData, description: e.target.value })}
                  className="min-h-[120px] rounded-xl border-border focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Founder + Wives */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Founder Card */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="h-1 bg-primary" />
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{t('founder_info', 'معلومات المؤسس')}</h3>
                </div>

                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <Label htmlFor="founderName" className="text-sm font-semibold text-foreground mb-2 block">
                      الاسم الأول * <span className="text-muted-foreground font-normal">(عائلة: {treeData.name})</span>
                    </Label>
                    <Input
                      id="founderName"
                      placeholder="الاسم الأول فقط"
                      value={founderData.name}
                      onChange={(e) => setFounderData({ ...founderData, name: e.target.value })}
                      className="h-12 rounded-xl border-border focus:border-primary"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <Label className="text-sm font-semibold text-foreground mb-2 block">الجنس *</Label>
                    <Select value={founderData.gender} onValueChange={(v) => setFounderData({ ...founderData, gender: v })}>
                      <SelectTrigger className="h-12 rounded-xl border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dates + Status Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-foreground mb-2 block">تاريخ الميلاد</Label>
                      <EnhancedDatePicker value={founderData.birthDate} onChange={(d) => setFounderData({ ...founderData, birthDate: d })} placeholder="تاريخ الميلاد" className="h-12" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground mb-2 block">الحالة</Label>
                      <Select value={founderData.isAlive ? "alive" : "deceased"} onValueChange={(v) => setFounderData({ ...founderData, isAlive: v === "alive" })}>
                        <SelectTrigger className="h-12 rounded-xl border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alive">على قيد الحياة</SelectItem>
                          <SelectItem value="deceased">متوفى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!founderData.isAlive && (
                      <div>
                        <Label className="text-sm font-semibold text-foreground mb-2 block">تاريخ الوفاة</Label>
                        <EnhancedDatePicker value={founderData.deathDate} onChange={(d) => setFounderData({ ...founderData, deathDate: d })} placeholder="تاريخ الوفاة" className="h-12" disableFuture />
                      </div>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div className="bg-muted/50 rounded-xl p-4 border border-border">
                    <Label className="text-sm font-semibold text-foreground mb-3 block">صورة المؤسس (اختياري)</Label>
                    <div className="flex items-center gap-4">
                      <input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFounderData({ ...founderData, image: file });
                          const reader = new FileReader();
                          reader.onload = (ev) => { setCropImage(ev.target?.result as string); setShowCropModal(true); };
                          reader.readAsDataURL(file);
                        }
                      }} className="hidden" id="founder-image" />
                      <Label htmlFor={isImageUploadEnabled ? "founder-image" : undefined} className={`flex-1 ${isImageUploadEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                        <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Upload className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">اختر صورة</p>
                            <p className="text-xs text-muted-foreground">JPG, PNG أو GIF</p>
                          </div>
                        </div>
                      </Label>
                      {founderData.croppedImage && (
                        <div className="relative">
                          <img src={founderData.croppedImage} alt="صورة المؤسس" className="w-16 h-16 rounded-lg object-cover border-2 border-primary/30" />
                          <button onClick={() => setFounderData({ ...founderData, croppedImage: null, image: null })} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Biography */}
                  <div>
                    <Label htmlFor="founderBio" className="text-sm font-semibold text-foreground mb-2 block">السيرة الذاتية (اختياري)</Label>
                    <Textarea id="founderBio" placeholder="معلومات عن المؤسس..." value={founderData.bio} onChange={(e) => setFounderData({ ...founderData, bio: e.target.value })} className="min-h-[100px] rounded-xl border-border focus:border-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Wives Card */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="h-1 bg-destructive/60" />
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">الزوجات (اختياري)</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-6">لا يمكنك اضافة أولاد لهذه العائلة اذا لم يتم إضافة زوجة للفرد الأول في الأسرة</p>

                {wives.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {wives.map((wife) => (
                      <div key={wife.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border hover:border-destructive/30 transition-colors">
                        <div>
                          <h4 className="font-semibold text-foreground">{wife.name}</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${wife.isAlive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {wife.isAlive ? "على قيد الحياة" : "متوفاة"}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${wife.maritalStatus === 'married' ? 'bg-primary/10 text-primary' : wife.maritalStatus === 'divorced' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                              {wife.maritalStatus === 'married' ? 'متزوجة' : wife.maritalStatus === 'divorced' ? 'مطلقة' : 'أرملة'}
                            </span>
                          </div>
                          {wife.birthDate && <p className="text-xs text-muted-foreground mt-1">مولودة: {format(wife.birthDate, "dd/MM/yyyy", { locale: ar })}</p>}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="rounded-lg"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { setEditingWife(wife); setIsAddingWife(true); }}>
                              <Edit className="h-4 w-4 mr-2" />{t('edit', 'تعديل')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setWives(wives.filter(w => w.id !== wife.id))}>
                              <Trash2 className="h-4 w-4 mr-2" />حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={() => setIsAddingWife(true)} variant="outline" className="w-full h-14 border-2 border-dashed border-border hover:border-destructive/50 hover:bg-destructive/5 rounded-xl transition-all">
                  <Plus className="h-5 w-5 me-2 text-destructive" />
                  <span className="font-semibold">إضافة زوجة جديدة</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 gap-4">
          <Button onClick={handlePrevStep} variant="outline" className="h-12 px-6 rounded-xl border-border">
            {direction === 'rtl' ? <ArrowRight className="h-5 w-5 me-2" /> : <ArrowLeft className="h-5 w-5 me-2" />}
            {currentStep === 1 ? t('back_to_dashboard', 'العودة للوحة التحكم') : t('previous', 'السابق')}
          </Button>

          <Button onClick={handleNextStep} disabled={isCreatingFamily} className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg">
            {currentStep === 1 ? t('next', 'التالي') : (isCreatingFamily ? t('creating_family_progress', 'جاري إنشاء العائلة...') : t('create_family_button', 'إنشاء العائلة'))}
            {currentStep === 1 && (direction === 'rtl' ? <ArrowLeft className="h-5 w-5 ms-2" /> : <ArrowRight className="h-5 w-5 ms-2" />)}
            {currentStep === 2 && !isCreatingFamily && <CheckCircle className="h-5 w-5 ms-2" />}
          </Button>
        </div>
      </div>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>قص الصورة</DialogTitle>
            <DialogDescription>اسحب لتحريك الصورة أو استخدم عجلة الماوس للتكبير والتصغير</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
            {cropImage && <Cropper image={cropImage} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCropModal(false)}>إلغاء</Button>
            <Button onClick={handleCropSave}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Wife Modal */}
      <Dialog open={isAddingWife} onOpenChange={setIsAddingWife}>
        <DialogContent className="w-[95vw] max-w-xl mx-4 sm:mx-auto bg-card border border-border shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <DialogHeader className="text-center pb-4 flex flex-col items-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingWife ? t('edit_wife', 'تعديل بيانات الزوجة') : t('add_new_wife', 'إضافة زوجة جديدة')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              {editingWife ? t('edit_wife_desc', 'عدل معلومات الزوجة') : t('add_wife_desc', 'أضف معلومات الزوجة لإدراجها في سجل العائلة')}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-muted/30 rounded-xl border border-border">
            <WifeForm
              ref={wifeFormRef}
              initialData={editingWife}
              onAddWife={(wifeData) => {
                const fullName = `${wifeData.first_name} ${wifeData.last_name}`.trim();
                if (editingWife) {
                  setWives(wives.map(w => w.id === editingWife.id ? { ...w, first_name: wifeData.first_name, last_name: wifeData.last_name, name: fullName, isAlive: wifeData.isAlive, birthDate: wifeData.birthDate, deathDate: wifeData.deathDate, maritalStatus: wifeData.maritalStatus } : w));
                  toast({ title: t('wife_updated_success', 'تم تحديث بيانات الزوجة بنجاح'), description: `تم تحديث ${fullName}` });
                } else {
                  setWives([...wives, { id: crypto.randomUUID(), first_name: wifeData.first_name, last_name: wifeData.last_name, name: fullName, isAlive: wifeData.isAlive, birthDate: wifeData.birthDate, deathDate: wifeData.deathDate, maritalStatus: wifeData.maritalStatus }]);
                  toast({ title: t('wife_added_success', 'تم إضافة الزوجة بنجاح'), description: `تم إضافة ${fullName}` });
                }
                setIsAddingWife(false); setEditingWife(null);
              }}
            />
          </div>

          <DialogFooter className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => { setIsAddingWife(false); setEditingWife(null); }} className="flex-1">
              {t('cancel', 'إلغاء')}
            </Button>
            <Button onClick={() => { if (wifeFormRef.current?.isValid()) wifeFormRef.current?.handleSubmit(); }} className="flex-1 bg-primary hover:bg-primary/90">
              <Heart className="h-4 w-4 me-2" />
              {editingWife ? t('update_wife', 'تحديث') : t('add_wife', 'إضافة الزوجة')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-lg bg-card border border-border shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <DialogHeader className="text-center pb-4 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-primary/30 rounded-full animate-ping" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground text-center">🎉 تم إنشاء العائلة بنجاح!</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 text-center">تم حفظ بيانات شجرة العائلة بنجاح</DialogDescription>
          </DialogHeader>

          <div className="p-5 bg-muted/30 rounded-xl border border-border text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">هل ترغب بإضافة أفراد للأسرة الآن؟</h3>
            <p className="text-sm text-muted-foreground bg-primary/5 rounded-lg p-3 border border-primary/10">
              يمكنك إضافتهم لاحقاً من خلال لوحة التحكم
            </p>
          </div>

          <DialogFooter className="flex gap-3 pt-4">
            <Button onClick={handleSkipToDashboard} variant="outline" className="flex-1 h-12">تخطي الآن</Button>
            <Button onClick={handleAddMoreMembers} className="flex-1 h-12 bg-primary hover:bg-primary/90 font-semibold">
              <Users className="h-5 w-5 me-2" />إضافة أفراد الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StitchFamilyCreator;
