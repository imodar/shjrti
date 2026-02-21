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
import { SpouseDrawer } from "@/components/stitch/SpouseDrawer";
import { SpouseData } from "@/components/SpouseForm";
import { StyledDropdown } from "@/components/stitch/StyledDropdown";

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
  const [currentSpouse, setCurrentSpouse] = useState<SpouseData>({
    id: crypto.randomUUID(), firstName: '', lastName: '', name: '', isAlive: true,
    birthDate: null, deathDate: null, maritalStatus: 'married', isFamilyMember: false,
    existingFamilyMemberId: '', croppedImage: null, biography: '', isSaved: false,
  });
  const [spouseFamilyStatus, setSpouseFamilyStatus] = useState<'yes' | 'no' | null>('no');
  const [spouseCommandOpen, setSpouseCommandOpen] = useState(false);
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

  const openSpouseDrawer = (wife?: typeof editingWife) => {
    const initSpouse: SpouseData = {
      id: wife?.id || crypto.randomUUID(),
      firstName: wife?.first_name || '',
      lastName: wife?.last_name || '',
      name: wife?.name || '',
      isAlive: wife?.isAlive ?? true,
      birthDate: wife?.birthDate || null,
      deathDate: wife?.deathDate || null,
      maritalStatus: wife?.maritalStatus || 'married',
      isFamilyMember: false,
      existingFamilyMemberId: '',
      croppedImage: null,
      biography: '',
      isSaved: false,
    };
    setCurrentSpouse(initSpouse);
    setSpouseFamilyStatus('no');
    if (wife) setEditingWife(wife);
    setIsAddingWife(true);
  };

  const handleSpouseSave = () => {
    if (!currentSpouse.firstName?.trim()) return;
    const fullName = `${currentSpouse.firstName} ${currentSpouse.lastName || ''}`.trim();
    if (editingWife) {
      setWives(wives.map(w => w.id === editingWife.id ? { ...w, first_name: currentSpouse.firstName, last_name: currentSpouse.lastName, name: fullName, isAlive: currentSpouse.isAlive, birthDate: currentSpouse.birthDate, deathDate: currentSpouse.deathDate, maritalStatus: currentSpouse.maritalStatus || 'married' } : w));
      toast({ title: t('wife_updated_success', 'تم تحديث بيانات الزوجة بنجاح'), description: `تم تحديث ${fullName}` });
    } else {
      setWives([...wives, { id: currentSpouse.id, first_name: currentSpouse.firstName, last_name: currentSpouse.lastName, name: fullName, isAlive: currentSpouse.isAlive, birthDate: currentSpouse.birthDate, deathDate: currentSpouse.deathDate, maritalStatus: currentSpouse.maritalStatus || 'married' }]);
      toast({ title: t('wife_added_success', 'تم إضافة الزوجة بنجاح'), description: `تم إضافة ${fullName}` });
    }
    setIsAddingWife(false);
    setEditingWife(null);
  };

  return (
    <div className="theme-stitch min-h-screen bg-slate-50 dark:bg-background">
      <StitchHeader hideNav variant="account" />

      <main className="max-w-5xl mx-auto px-4 py-12 relative overflow-hidden">
        {/* Abstract Background Roots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.06]">
          <svg className="absolute top-0 end-0 w-1/2 h-full text-muted-foreground" fill="none" viewBox="0 0 400 800">
            <path d="M400 0C400 200 200 300 100 500C0 700 0 800 0 800" stroke="currentColor" strokeWidth="2" />
            <path d="M400 100C300 300 150 400 50 600" stroke="currentColor" strokeDasharray="4 4" strokeWidth="1" />
          </svg>
        </div>

        {/* Page Heading */}
        <div className="text-center mb-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-4">
            <span className="material-icons-round text-sm">eco</span>
            {t('planting_legacy', 'زراعة إرث جديد')}
          </div>
          <h2 className="font-bold text-3xl md:text-4xl text-foreground mb-3">
            {currentStep === 1 ? t('create_family_tree', 'إنشاء شجرة العائلة') : t('founders_legacy', 'إرث المؤسس')}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
            {currentStep === 1
              ? t('create_tree_description', 'كل إرث عظيم يبدأ باسم واحد. لنبدأ بتوثيق رحلة عائلتك الفريدة.')
              : t('founder_subtitle', 'أضف جذر شجرة عائلتك — الأب أو الأم المؤسس')}
          </p>
        </div>

        {/* Step Dots Indicator with Numbers */}
        <div className="flex items-center justify-center gap-3 mb-12 relative z-10">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${currentStep === 1 ? 'bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20 shadow-lg shadow-primary/30' : 'bg-primary/20 text-primary'}`}>1</div>
          <div className={`w-10 h-0.5 rounded-full transition-all duration-500 ${currentStep >= 2 ? 'bg-primary' : 'bg-border'}`} />
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${currentStep === 2 ? 'bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20 shadow-lg shadow-primary/30' : 'bg-border text-muted-foreground'}`}>2</div>
        </div>

        {/* ─── Step 1: Family Identity ─── */}
        <div
          className={`relative z-10 flex flex-col items-center transition-all duration-500 ease-out ${
            currentStep === 1
              ? 'opacity-100 translate-y-0 max-h-[2000px]'
              : 'opacity-0 -translate-y-8 max-h-0 overflow-hidden pointer-events-none'
          }`}
        >


          <div className="w-full max-w-2xl bg-card/70 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-muted/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-icons-round text-2xl">home</span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-foreground">{t('family_identity', 'هوية العائلة')}</h3>
                <p className="text-xs text-muted-foreground">{t('family_identity_desc', 'الاسم الذي يحدد تراثك')}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {t('family_name_required', 'اسم شجرة العائلة *')}
                </label>
                <Input
                  placeholder={t('family_name_example', 'مثال: شجرة عائلة السعيد')}
                  value={treeData.name}
                  onChange={(e) => setTreeData({ ...treeData, name: e.target.value })}
                  className="h-14 rounded-xl border-border/50 bg-muted/30 text-lg font-medium focus:border-primary focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {t('family_description_optional', 'وصف مختصر (اختياري)')}
                </label>
                <Textarea
                  placeholder={t('family_description_placeholder', 'صف بإيجاز أصول أو فروع هذه الشجرة...')}
                  value={treeData.description}
                  onChange={(e) => setTreeData({ ...treeData, description: e.target.value })}
                  rows={3}
                  className="rounded-xl border-border/50 bg-muted/30 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Next Button inside Step 1 card */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
              <button
                onClick={handlePrevStep}
                className="px-6 py-3 text-muted-foreground font-bold text-sm hover:text-foreground transition-colors"
              >
                {t('back_to_dashboard', 'العودة للوحة التحكم')}
              </button>
              <Button
                onClick={handleNextStep}
                disabled={!treeData.name.trim()}
                className="px-8 py-3 h-auto bg-primary text-primary-foreground font-bold text-sm rounded-2xl shadow-xl shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                {t('next', 'متابعة')}
                {direction === 'rtl' ? <ArrowLeft className="h-4 w-4 ms-2" /> : <ArrowRight className="h-4 w-4 ms-2" />}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Step 2: The Founder's Legacy ─── */}
        <div
          className={`relative z-10 flex flex-col items-center transition-all duration-500 ease-out ${
            currentStep === 2
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-12 max-h-0 overflow-hidden pointer-events-none'
          }`}
        >


          <div className="w-full max-w-2xl bg-card/70 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-muted/20">
            {/* Founder Section Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-foreground">{t('founders_legacy', 'إرث المؤسس')}</h3>
                <p className="text-xs text-muted-foreground">{t('founder_subtitle', 'أضف جذر شجرة عائلتك — الأب أو الأم المؤسس')}</p>
              </div>
            </div>

            {/* Founder Avatar + Name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 relative group flex-shrink-0">
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center border-4 border-card shadow-inner overflow-hidden">
                  {founderData.croppedImage ? (
                    <img src={founderData.croppedImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-icons-round text-4xl text-primary/30">person</span>
                  )}
                </div>
                {isImageUploadEnabled && (
                  <>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFounderData({ ...founderData, image: file });
                        const reader = new FileReader();
                        reader.onload = (ev) => { setCropImage(ev.target?.result as string); setShowCropModal(true); };
                        reader.readAsDataURL(file);
                      }
                    }} className="hidden" id="founder-image-journey" />
                    <label htmlFor="founder-image-journey" className="absolute bottom-0 end-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg border-2 border-card cursor-pointer hover:scale-110 transition-transform">
                      <span className="material-icons-round text-sm">photo_camera</span>
                    </label>
                  </>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">person</span>
                  {t('founders_name', 'اسم المؤسس')} *
                </label>
                <input
                  type="text"
                  value={founderData.name}
                  onChange={(e) => setFounderData({ ...founderData, name: e.target.value })}
                  placeholder={t('founders_name', 'اسم المؤسس')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-primary/10 rounded-full text-[10px] font-bold text-primary flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {t('founder_badge', 'مؤسس')}
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Details */}
            <div className="space-y-4 mb-8">
              <div className={`grid gap-4 ${!founderData.isAlive ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                    {t('birth_date', 'تاريخ الميلاد')}
                  </label>
                  <input
                    type="date"
                    value={founderData.birthDate ? founderData.birthDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFounderData({ ...founderData, birthDate: e.target.value ? new Date(e.target.value) : null })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-primary text-lg">vital_signs</span>
                    {t('status', 'الحالة')}
                  </label>
                  <StyledDropdown
                    options={[
                      { value: 'living', label: t('member.living', 'على قيد الحياة'), icon: 'favorite' },
                      { value: 'deceased', label: t('member.deceased', 'متوفى'), icon: 'heart_broken' }
                    ]}
                    value={founderData.isAlive ? 'living' : 'deceased'}
                    onChange={(value) => setFounderData({ ...founderData, isAlive: value === 'living', deathDate: value === 'living' ? null : founderData.deathDate })}
                    accentColor="primary"
                  />
                </div>
                {!founderData.isAlive && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-primary text-lg">event</span>
                      {t('death_date', 'تاريخ الوفاة')}
                    </label>
                    <input
                      type="date"
                      value={founderData.deathDate ? founderData.deathDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => setFounderData({ ...founderData, deathDate: e.target.value ? new Date(e.target.value) : null })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-lg">notes</span>
                  {t('biography', 'السيرة الذاتية')}
                </label>
                <textarea
                  value={founderData.bio}
                  onChange={(e) => setFounderData({ ...founderData, bio: e.target.value })}
                  placeholder={t('founder_bio_placeholder', 'سيرة مختصرة...')}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/30 mb-6" />

            {/* Spouses Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-foreground">{t('spouses_partners', 'الزوجات')}</h4>
                    <p className="text-[10px] text-muted-foreground">{t('add_spouses_desc', 'أضف زوجة أو أكثر للمؤسس')}</p>
                  </div>
                </div>
                <button
                  onClick={() => openSpouseDrawer()}
                  className="bg-primary text-primary-foreground p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {wives.length === 0 ? (
                  <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-icons-round text-xl">person</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-muted-foreground">{t('no_spouses_yet', 'لم تتم إضافة زوجات بعد')}</p>
                      <p className="text-[10px] text-muted-foreground/70">{t('click_plus_spouse', 'اضغط + لإضافة زوجة')}</p>
                    </div>
                  </div>
                ) : (
                  wives.map((wife) => (
                    <div key={wife.id} className="bg-muted/30 border border-border/50 rounded-2xl p-4 flex items-center gap-4 group hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-icons-round text-xl">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{wife.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${wife.isAlive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {wife.isAlive ? "حية" : "متوفاة"}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${wife.maritalStatus === 'married' ? 'bg-primary/10 text-primary' : wife.maritalStatus === 'divorced' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                            {wife.maritalStatus === 'married' ? 'متزوجة' : wife.maritalStatus === 'divorced' ? 'مطلقة' : 'أرملة'}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openSpouseDrawer(wife)}>
                            <Edit className="h-4 w-4 me-2" />{t('edit', 'تعديل')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setWives(wives.filter(w => w.id !== wife.id))}>
                            <Trash2 className="h-4 w-4 me-2" />حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))
                )}
                <p className="text-[10px] text-center text-muted-foreground italic pt-1">
                  {t('spouse_note', 'لا يمكنك إضافة أولاد بدون إضافة زوجة أولاً')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons for Step 2 */}
          <div className="flex items-center justify-center gap-4 md:gap-6 mt-10">
            <button
              onClick={handlePrevStep}
              className="px-6 md:px-8 py-3 md:py-4 text-muted-foreground font-bold text-sm hover:text-foreground transition-colors"
            >
              {t('previous', 'السابق')}
            </button>

            {/* Create button - only visible when founder name + at least 1 wife */}
            <Button
              onClick={handleNextStep}
              disabled={isCreatingFamily || !founderData.name.trim() || wives.length === 0}
              className={`px-8 md:px-12 py-3 md:py-4 h-auto bg-primary text-primary-foreground font-bold text-sm rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-95 ${
                founderData.name.trim() && wives.length > 0
                  ? 'hover:-translate-y-0.5 opacity-100'
                  : 'opacity-40 pointer-events-none'
              }`}
            >
              {isCreatingFamily ? t('creating_family_progress', 'جاري الإنشاء...') : t('create_family_button', 'إنشاء الشجرة والمتابعة')}
              {!isCreatingFamily && <CheckCircle className="h-4 w-4 ms-2" />}
            </Button>
          </div>
        </div>

        {/* Side Step Indicator (xl screens) */}
        <aside className="fixed end-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 items-center z-40">
          {[
            { label: t('identity', 'الهوية'), step: 1 },
            { label: t('founder', 'المؤسس'), step: 2 },
          ].map((s, i) => (
            <div key={i}>
              <div className="group relative">
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${currentStep === s.step ? 'bg-primary ring-4 ring-primary/20' : currentStep > s.step ? 'bg-primary/40' : 'bg-border'}`} />
                <span className="absolute end-6 top-1/2 -translate-y-1/2 whitespace-nowrap bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {s.label}
                </span>
              </div>
              {i < 1 && <div className="w-px h-10 bg-border mx-auto mt-2" />}
            </div>
          ))}
        </aside>
      </main>

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

      {/* SpouseDrawer */}
      <SpouseDrawer
        isOpen={isAddingWife}
        onClose={() => { setIsAddingWife(false); setEditingWife(null); }}
        spouseType="wife"
        currentSpouse={currentSpouse}
        onSpouseChange={setCurrentSpouse}
        familyMembers={[]}
        marriages={[]}
        spouseCommandOpen={spouseCommandOpen}
        onCommandOpenChange={setSpouseCommandOpen}
        spouseFamilyStatus={spouseFamilyStatus}
        onFamilyStatusChange={setSpouseFamilyStatus}
        onSave={handleSpouseSave}
        isImageUploadEnabled={isImageUploadEnabled}
        hideToggle
        onImageUploadClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                setCropImage(ev.target?.result as string);
                setShowCropModal(true);
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }}
      />

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
