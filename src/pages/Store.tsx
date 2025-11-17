import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  TreePine, 
  Package, 
  CreditCard, 
  Check, 
  ArrowRight,
  Frame,
  Ruler,
  Palette,
  MapPin,
  Phone,
  Crown,
  ChevronRight,
  ChevronLeft,
  User,
  Users,
  ShoppingBag,
  Star,
  Store as StoreIcon
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";

// Design options data
const designTemplates = [
  { id: 'classic', name: 'كلاسيكي', price: 0, image: '🌳', isPremium: false },
  { id: 'modern', name: 'عصري', price: 25, image: '🌲', isPremium: true },
  { id: 'vintage', name: 'تراثي', price: 35, image: '🍃', isPremium: true },
  { id: 'elegant', name: 'أنيق', price: 45, image: '🌿', isPremium: true },
];

const frameOptions = [
  { id: 'none', name: 'بدون إطار', price: 0 },
  { id: 'wood', name: 'إطار خشبي', price: 20 },
  { id: 'gold', name: 'إطار ذهبي', price: 35 },
  { id: 'silver', name: 'إطار فضي', price: 30 },
  { id: 'premium', name: 'إطار مميز', price: 50 },
];

const sizeOptions = [
  { id: 'A4', name: 'A4 (21×30 سم)', price: 15 },
  { id: 'A3', name: 'A3 (30×42 سم)', price: 25 },
  { id: 'A2', name: 'A2 (42×59 سم)', price: 40 },
  { id: 'A1', name: 'A1 (59×84 سم)', price: 60 },
  { id: 'custom', name: 'مقاس مخصص', price: 75 },
];

const customSizeOptions = [
  { id: 'custom-small', name: '20×25 سم', price: 50 },
  { id: 'custom-medium', name: '35×50 سم', price: 85 },
  { id: 'custom-large', name: '50×70 سم', price: 120 },
  { id: 'custom-xlarge', name: '70×100 سم', price: 180 },
  { id: 'custom-poster', name: '100×150 سم', price: 250 },
  { id: 'custom-banner', name: '150×200 سم', price: 350 },
];

export default function Store() {
  const { direction } = useLanguage();
  const navigate = useNavigate();
  const [selectedDesign, setSelectedDesign] = useState('classic');
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [selectedSize, setSelectedSize] = useState('A4');
  const [selectedCustomSize, setSelectedCustomSize] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderNumber] = useState(`ORD-${Date.now()}`);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCustomizationFinished, setIsCustomizationFinished] = useState(false);
  
  const shippingRef = useRef<HTMLDivElement>(null);

  // Mock tree data - In real app, this would come from family tree state
  const mockTreeData = {
    rootPerson: { name: 'أحمد محمد', gender: 'male' },
    spouse: { name: 'فاطمة علي', gender: 'female' },
    children: [
      { name: 'محمد أحمد', gender: 'male' },
      { name: 'عائشة أحمد', gender: 'female' },
      { name: 'علي أحمد', gender: 'male' }
    ],
    parents: [
      { name: 'محمد حسن', gender: 'male' },
      { name: 'زينب سالم', gender: 'female' }
    ]
  };

  // Calculate total price
  const designPrice = designTemplates.find(d => d.id === selectedDesign)?.price || 0;
  const framePrice = frameOptions.find(f => f.id === selectedFrame)?.price || 0;
  
  // Handle custom size pricing and display
  let sizePrice = 0;
  let sizeDisplayName = '';
  
  if (selectedSize === 'custom' && selectedCustomSize) {
    const customSize = customSizeOptions.find(s => s.id === selectedCustomSize);
    sizePrice = customSize?.price || 0;
    sizeDisplayName = customSize?.name || 'مقاس مخصص';
  } else {
    const standardSize = sizeOptions.find(s => s.id === selectedSize);
    sizePrice = standardSize?.price || 0;
    sizeDisplayName = standardSize?.name || '';
  }
  
  const totalPrice = designPrice + framePrice + sizePrice;

  const wizardSteps = [
    { title: 'اختر التصميم', icon: Palette },
    { title: 'اختر الإطار', icon: Frame },
    { title: 'اختر المقاس', icon: Ruler }
  ];

  const handleOrder = () => {
    if (!shippingAddress.trim() || !phoneNumber.trim()) {
      alert('يرجى ملء جميع البيانات المطلوبة');
      return;
    }
    
    // In a real app, this would redirect to payment gateway
    // For now, we'll show success dialog
    setOrderDialogOpen(true);
  };

  const handleFinishConfiguration = () => {
    setIsCustomizationFinished(true);
  };

  const handleBackToCustomization = () => {
    setIsCustomizationFinished(false);
  };

  const handleNextStep = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinishConfiguration();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-r from-accent/15 to-primary/15 rounded-full blur-2xl animate-bounce" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 backdrop-blur-xl border-b border-gradient-to-r from-primary/30 to-secondary/30 sticky top-0 z-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-2 left-10 w-6 h-6 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute top-6 left-32 w-4 h-4 bg-accent/30 rotate-45 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-4 left-64 w-3 h-3 bg-secondary/25 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-primary via-accent to-secondary rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                  <ShoppingCart className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  متجر الطباعة
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <p className="text-muted-foreground font-medium">اطبع شجرة عائلتك بأجمل التصاميم</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/family-builder">
                <Button
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl px-6"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  العودة لمنشئ الشجرة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-8 relative z-10">
        {/* Hero Section with Tabs */}
        <div className="max-w-7xl mx-auto px-6 relative">
            <div className="text-center mb-8">
              {/* Tab Navigation */}
              <Tabs value="store" className="space-y-8" style={{direction: 'rtl'}}>
                <div className="flex justify-center relative">
                  {/* Creative floating background with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl blur-xl scale-110 animate-pulse opacity-50"></div>
                <div className="relative z-10 backdrop-blur-3xl bg-gradient-to-r from-card/60 via-card/80 to-card/60 border border-primary/30 rounded-3xl p-2 shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-500 hover:scale-105">
                    {/* Decorative corner elements */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-primary to-accent rounded-full animate-ping opacity-60"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-br from-accent to-primary rounded-full animate-pulse"></div>
                    <TabsList className="bg-transparent backdrop-blur-sm border-0 rounded-2xl p-1 shadow-none flex-row-reverse relative">
                    <div 
                      onClick={() => navigate('/family-builder')}
                      className="rounded-xl px-6 py-3 transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-primary/10 cursor-pointer flex items-center justify-center"
                    >
                      <Star className="ml-2 h-4 w-4" />
                      الإحصائيات
                    </div>
                    <div className="rounded-xl px-6 py-3 transition-all duration-300 bg-primary text-primary-foreground shadow-lg flex items-center justify-center">
                      <StoreIcon className="ml-2 h-4 w-4" />
                      المتجر
                    </div>
                    <div 
                      onClick={() => navigate('/family-builder')}
                      className="rounded-xl px-6 py-3 transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-primary/10 cursor-pointer flex items-center justify-center"
                    >
                      <TreePine className="ml-2 h-4 w-4" />
                      عرض الشجرة
                    </div>
                    <div 
                      onClick={() => navigate('/family-builder')}
                      className="rounded-xl px-6 py-3 transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-primary/10 cursor-pointer flex items-center justify-center"
                    >
                      <Users className="ml-2 h-4 w-4" />
                      نظرة عامة
                    </div>
                  </TabsList>
                </div>
              </div>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Main Product Section */}
        <div className="max-w-7xl mx-auto px-6 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* Live Preview Section - Sticky */}
            <div className="lg:sticky lg:top-8 space-y-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 rounded-3xl blur-2xl opacity-30" />
                <Card className="relative bg-gradient-to-br from-card via-card/90 to-accent/5 backdrop-blur-xl border-2 border-primary/20 shadow-2xl overflow-hidden rounded-3xl">
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <CardTitle className="text-2xl font-bold text-foreground">معاينة مباشرة</CardTitle>
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                    </div>
                    <CardDescription className="text-muted-foreground">
                      شاهد شجرة عائلتك كما ستبدو بعد الطباعة
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-8">
                    {/* Enhanced Preview Area with Real Tree Data */}
                    <div className="relative bg-gradient-to-br from-background via-accent/2 to-secondary/2 rounded-2xl p-8 border-2 border-dashed border-primary/30 min-h-[500px] flex items-center justify-center group hover:shadow-2xl transition-all duration-500">
                      
                      {/* Dynamic Frame Effect */}
                      <div 
                        className={`absolute inset-4 rounded-xl transition-all duration-700 ${
                          selectedFrame === 'wood' ? 
                            'bg-gradient-to-br from-amber-50 to-amber-100 shadow-[inset_0_0_20px_rgba(217,119,6,0.3)] border-8 border-amber-400' :
                          selectedFrame === 'gold' ? 
                            'bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-[inset_0_0_20px_rgba(234,179,8,0.4)] border-8 border-yellow-500' :
                          selectedFrame === 'silver' ? 
                            'bg-gradient-to-br from-gray-50 to-gray-100 shadow-[inset_0_0_20px_rgba(107,114,128,0.3)] border-8 border-gray-400' :
                          selectedFrame === 'premium' ? 
                            'bg-gradient-to-br from-purple-50 to-purple-100 shadow-[inset_0_0_20px_rgba(147,51,234,0.4)] border-8 border-purple-500' :
                            'bg-transparent'
                        }`}
                      />
                      
                      {/* Live Tree Preview with Real Data */}
                      <div className="relative z-10 w-full max-w-md transform group-hover:scale-105 transition-transform duration-500">
                        
                        {/* Tree Structure Based on Design */}
                        {selectedDesign === 'classic' && (
                          <div className="text-center space-y-6">
                            {/* Parents Generation */}
                            <div className="flex justify-center gap-4 mb-4">
                              {mockTreeData.parents.map((parent, i) => (
                                <div key={i} className="flex flex-col items-center">
                                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center shadow-lg border-2 border-primary/30 hover:scale-110 transition-transform">
                                    {parent.gender === 'male' ? <User className="h-8 w-8 text-primary" /> : <User className="h-8 w-8 text-accent" />}
                                  </div>
                                  <span className="text-xs mt-2 font-medium text-muted-foreground">{parent.name}</span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Tree Icon */}
                            <div className="text-6xl animate-bounce drop-shadow-lg">🌳</div>
                            
                            {/* Current Generation */}
                            <div className="flex justify-center gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-xl border-3 border-primary hover:scale-110 transition-transform">
                                  <User className="h-10 w-10 text-white" />
                                </div>
                                <span className="text-sm mt-2 font-bold text-primary">{mockTreeData.rootPerson.name}</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center shadow-xl border-3 border-accent hover:scale-110 transition-transform">
                                  <User className="h-10 w-10 text-white" />
                                </div>
                                <span className="text-sm mt-2 font-bold text-accent">{mockTreeData.spouse.name}</span>
                              </div>
                            </div>
                            
                            {/* Children Generation */}
                            <div className="flex justify-center gap-2 flex-wrap">
                              {mockTreeData.children.map((child, i) => (
                                <div key={i} className="flex flex-col items-center">
                                  <div className="w-14 h-14 bg-gradient-to-br from-secondary/60 to-primary/60 rounded-full flex items-center justify-center shadow-lg border-2 border-secondary hover:scale-110 transition-transform">
                                    <User className="h-6 w-6 text-white" />
                                  </div>
                                  <span className="text-xs mt-1 font-medium text-muted-foreground">{child.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedDesign === 'modern' && (
                          <div className="text-center space-y-6">
                            <div className="text-6xl animate-pulse drop-shadow-lg">🌲</div>
                            <div className="flex flex-col items-center space-y-4">
                              {/* Modern geometric layout */}
                              <div className="flex justify-center gap-3">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary via-accent to-secondary rounded-2xl flex flex-col items-center justify-center text-white shadow-2xl transform hover:rotate-6 transition-transform">
                                  <User className="h-6 w-6" />
                                  <span className="text-xs mt-1">{mockTreeData.rootPerson.name.split(' ')[0]}</span>
                                </div>
                                <div className="w-16 h-16 bg-gradient-to-br from-accent via-secondary to-primary rounded-2xl flex flex-col items-center justify-center text-white shadow-2xl transform hover:-rotate-6 transition-transform">
                                  <User className="h-6 w-6" />
                                  <span className="text-xs mt-1">{mockTreeData.spouse.name.split(' ')[0]}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {mockTreeData.children.map((child, i) => (
                                  <div key={i} className="w-12 h-12 bg-gradient-to-br from-secondary via-primary to-accent rounded-2xl flex items-center justify-center text-white text-xs font-bold shadow-2xl transform hover:rotate-3 transition-transform">
                                    {child.name.charAt(0)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedDesign === 'vintage' && (
                          <div className="text-center space-y-6 filter sepia-[0.3] contrast-125">
                            <div className="text-6xl animate-pulse drop-shadow-lg">🍃</div>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-18 h-18 bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-amber-600 rounded-full flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
                                    <span className="text-amber-800 text-2xl">♂</span>
                                  </div>
                                  <span className="text-xs mt-2 text-amber-800 font-semibold">{mockTreeData.rootPerson.name}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <div className="w-18 h-18 bg-gradient-to-br from-pink-100 to-pink-200 border-4 border-pink-600 rounded-full flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
                                    <span className="text-pink-800 text-2xl">♀</span>
                                  </div>
                                  <span className="text-xs mt-2 text-pink-800 font-semibold">{mockTreeData.spouse.name}</span>
                                </div>
                              </div>
                              <div className="flex justify-center gap-2">
                                {mockTreeData.children.map((child, i) => (
                                  <div key={i} className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-600 rounded-full flex items-center justify-center shadow-lg">
                                      <span className="text-green-800 text-sm">{child.gender === 'male' ? '♂' : '♀'}</span>
                                    </div>
                                    <span className="text-xs mt-1 text-green-800">{child.name.split(' ')[0]}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedDesign === 'elegant' && (
                          <div className="text-center space-y-6">
                            <div className="text-6xl animate-pulse text-primary drop-shadow-lg">🌿</div>
                            <div className="flex flex-col items-center space-y-4">
                              {/* Elegant minimalist lines */}
                              <div className="w-24 h-1 bg-gradient-to-r from-primary via-accent via-secondary to-primary rounded-full shadow-xl"></div>
                              <div className="flex justify-center gap-6">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-24 bg-gradient-to-b from-primary via-accent to-secondary rounded-full shadow-xl transform hover:scale-110 transition-transform"></div>
                                  <span className="text-xs mt-2 font-medium">{mockTreeData.rootPerson.name}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-24 bg-gradient-to-b from-accent via-secondary to-primary rounded-full shadow-xl transform hover:scale-110 transition-transform"></div>
                                  <span className="text-xs mt-2 font-medium">{mockTreeData.spouse.name}</span>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                {mockTreeData.children.map((child, i) => (
                                  <div key={i} className="flex flex-col items-center">
                                    <div className="w-1 h-16 bg-gradient-to-b from-secondary to-primary rounded-full shadow-lg"></div>
                                    <span className="text-xs mt-1">{child.name.split(' ')[0]}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Enhanced Size Badge */}
                        <div className="mt-8">
                          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border border-primary/30 rounded-full shadow-lg backdrop-blur-sm">
                            <Ruler className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-primary">
                              {sizeDisplayName}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating Animation Elements */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-8 right-8 w-3 h-3 bg-primary/40 rounded-full animate-ping" />
                        <div className="absolute bottom-12 left-12 w-4 h-4 bg-accent/40 rounded-full animate-ping" style={{animationDelay: '1s'}} />
                        <div className="absolute top-16 left-16 w-2 h-2 bg-secondary/40 rounded-full animate-ping" style={{animationDelay: '2s'}} />
                        <div className="absolute bottom-20 right-20 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{animationDelay: '1.5s'}} />
                      </div>
                    </div>
                    
                    {/* Enhanced Preview Details */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">التصميم المحدد</span>
                          <span className="font-bold text-primary">
                            {designTemplates.find(d => d.id === selectedDesign)?.name}
                          </span>
                        </div>
                      </div>
                      {selectedFrame !== 'none' && (
                        <div className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl border border-accent/20 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">الإطار</span>
                            <span className="font-bold text-accent">
                              {frameOptions.find(f => f.id === selectedFrame)?.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Unified Wizard Configuration Box */}
            <div className="space-y-8">
              <Card className="bg-gradient-to-br from-card via-card/95 to-primary/2 backdrop-blur-xl border border-primary/20 shadow-xl overflow-hidden rounded-2xl">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                
                <CardHeader>
                  <CardTitle className="text-center text-xl font-bold">اختر التخصيص المطلوب</CardTitle>
                  
                  {/* Wizard Steps Indicator */}
                  <div className="flex justify-center items-center gap-4 mt-4">
                    {wizardSteps.map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div key={index} className="flex items-center">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                            index === currentStep 
                              ? 'bg-primary border-primary text-white shadow-lg scale-110' 
                              : index < currentStep 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'bg-background border-muted-foreground/30 text-muted-foreground'
                          }`}>
                            {index < currentStep ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <span className={`mr-2 text-sm font-medium ${
                            index === currentStep ? 'text-primary' : index < currentStep ? 'text-green-600' : 'text-muted-foreground'
                          }`}>
                            {step.title}
                          </span>
                          {index < wizardSteps.length - 1 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardHeader>
                
                <CardContent className="p-8 border-t border-border/50">
                  {/* Step 0: Design Templates */}
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
                          <Palette className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">اختر تصميم الشجرة</h3>
                        <p className="text-muted-foreground">حدد النمط الذي يناسب ذوقك</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {designTemplates.map((template) => (
                          <div
                            key={template.id}
                            onClick={() => setSelectedDesign(template.id)}
                            className={`relative cursor-pointer group transition-all duration-500 transform ${
                              selectedDesign === template.id 
                                ? 'scale-105 z-10' 
                                : 'hover:scale-102 hover:-translate-y-1'
                            }`}
                          >
                            {/* Selection Glow Effect */}
                            {selectedDesign === template.id && (
                              <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30 rounded-2xl blur-xl opacity-75 animate-pulse" />
                            )}
                            
                            {/* Main Card */}
                            <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 backdrop-blur-sm ${
                              selectedDesign === template.id
                                ? 'border-primary/60 bg-gradient-to-br from-primary/15 via-accent/10 to-secondary/5 shadow-2xl'
                                : 'border-border/40 bg-gradient-to-br from-card/90 via-card/70 to-accent/5 hover:border-primary/40 hover:shadow-xl'
                            }`}>
                              
                              {/* Premium Badge Ribbon */}
                              {template.isPremium && (
                                <div className="absolute -top-1 -right-1 z-20">
                                  <div className="bg-gradient-to-r from-accent via-secondary to-primary px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-lg">
                                    <div className="flex items-center gap-1">
                                      <Crown className="h-3 w-3 text-white" />
                                      <span className="text-xs font-bold text-white">مميز</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Top Section - Icon & Visual */}
                              <div className="p-6 pb-4">
                                 <div className="flex items-center justify-center mb-4">
                                   <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                     selectedDesign === template.id
                                       ? 'bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 shadow-lg transform rotate-3'
                                       : 'bg-gradient-to-br from-muted/50 to-accent/10 group-hover:shadow-md group-hover:-rotate-1'
                                   }`}>
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 rounded-2xl opacity-20">
                                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl" />
                                    </div>
                                    
                                     {/* Template Icon */}
                                     <span className={`relative text-3xl transition-all duration-500 ${
                                       selectedDesign === template.id ? 'animate-bounce' : 'group-hover:scale-110'
                                     }`}>
                                       {template.image}
                                     </span>
                                    
                                    {/* Selection Indicator */}
                                    {selectedDesign === template.id && (
                                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                        <Check className="h-4 w-4 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                 {/* Template Name */}
                                 <h3 className={`text-center text-base font-bold mb-4 transition-colors duration-300 ${
                                   selectedDesign === template.id ? 'text-primary' : 'text-foreground group-hover:text-primary'
                                 }`}>
                                   {template.name}
                                 </h3>
                               </div>
                              
                              {/* Bottom Section - Price & Selection */}
                              <div className={`px-6 py-4 border-t transition-all duration-300 ${
                                selectedDesign === template.id
                                  ? 'border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5'
                                  : 'border-border/20 bg-gradient-to-r from-muted/5 to-accent/5'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold transition-all duration-300 ${
                                      template.price > 0
                                        ? selectedDesign === template.id
                                          ? 'bg-accent/20 text-accent'
                                          : 'bg-muted/50 text-muted-foreground group-hover:bg-accent/10'
                                        : selectedDesign === template.id
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-green-50 text-green-600 group-hover:bg-green-100'
                                    }`}>
                                      {template.price > 0 ? `+${template.price} ريال` : 'مجاني'}
                                    </div>
                                  </div>
                                  
                                  {/* Selection Radio */}
                                  <div className={`relative w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                                    selectedDesign === template.id 
                                      ? 'border-primary bg-primary shadow-lg' 
                                      : 'border-muted-foreground/30 group-hover:border-primary/50'
                                  }`}>
                                    {selectedDesign === template.id && (
                                      <div className="absolute inset-1 bg-white rounded-full animate-scale-in" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Hover Effect Overlay */}
                              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 1: Frame Options */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
                          <Frame className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">اختر الإطار</h3>
                        <p className="text-muted-foreground">إضافة إطار أنيق لشجرة عائلتك</p>
                      </div>
                      
                      <RadioGroup 
                        value={selectedFrame} 
                        onValueChange={setSelectedFrame}
                        className="space-y-3"
                      >
                        {frameOptions.map((frame) => (
                          <div
                            key={frame.id}
                            className={`group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer ${
                              selectedFrame === frame.id
                                ? 'ring-2 ring-accent ring-offset-2 ring-offset-background shadow-2xl shadow-accent/25'
                                : 'hover:shadow-xl hover:-translate-y-1'
                            }`}
                            onClick={() => setSelectedFrame(frame.id)}
                          >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 transition-all duration-500 ${
                              selectedFrame === frame.id
                                ? 'bg-gradient-to-r from-accent/20 via-secondary/10 to-primary/15'
                                : 'bg-gradient-to-r from-card via-card/95 to-card/90 group-hover:from-accent/5 group-hover:to-secondary/5'
                            }`} />
                            
                            {/* Animated Border */}
                            <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                              selectedFrame === frame.id
                                ? 'border-2 border-accent'
                                : 'border border-border group-hover:border-accent/30'
                            }`} />
                            
                            {/* Content */}
                            <div className="relative p-6">
                              <div className="flex items-center justify-between">
                                {/* Left Side - Radio and Label */}
                                <div className="flex items-center gap-4">
                                  <RadioGroupItem 
                                    value={frame.id} 
                                    id={frame.id}
                                    className={`transition-colors duration-300 ${
                                      selectedFrame === frame.id ? 'border-accent text-accent' : 'border-muted-foreground'
                                    }`}
                                  />
                                  
                                  {/* Frame Icon */}
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                    selectedFrame === frame.id
                                      ? 'bg-accent shadow-lg'
                                      : 'bg-muted group-hover:bg-accent/20'
                                  }`}>
                                    <Frame className={`h-5 w-5 transition-colors duration-300 ${
                                      selectedFrame === frame.id ? 'text-white' : 'text-muted-foreground group-hover:text-accent'
                                    }`} />
                                  </div>
                                  
                                  <Label htmlFor={frame.id} className={`text-lg font-semibold cursor-pointer transition-colors duration-300 ${
                                    selectedFrame === frame.id ? 'text-accent' : 'text-foreground group-hover:text-accent'
                                  }`}>
                                    {frame.name}
                                  </Label>
                                </div>
                                
                                {/* Right Side - Price and Check */}
                                <div className="flex items-center gap-3">
                                  <span className={`text-xl font-bold transition-colors duration-300 ${
                                    selectedFrame === frame.id ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'
                                  }`}>
                                    {frame.price > 0 ? `+${frame.price} ريال` : 'مجاني'}
                                  </span>
                                  
                                  {selectedFrame === frame.id && (
                                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center animate-scale-in shadow-lg">
                                      <Check className="h-5 w-5 text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Glow Effect */}
                            {selectedFrame === frame.id && (
                              <div className="absolute -inset-1 bg-gradient-to-r from-accent via-secondary to-primary rounded-2xl opacity-20 blur-lg animate-pulse" />
                            )}
                            
                            {/* Hover Shimmer Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {/* Step 2: Size Options */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4">
                          <Ruler className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">اختر المقاس</h3>
                        <p className="text-muted-foreground">حدد الحجم المناسب للطباعة</p>
                      </div>
                      
                      <RadioGroup 
                        value={selectedSize} 
                        onValueChange={setSelectedSize}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        {sizeOptions.map((size) => (
                          <div
                            key={size.id}
                            className={`group relative overflow-hidden rounded-xl transition-all duration-500 cursor-pointer ${
                              selectedSize === size.id
                                ? 'ring-2 ring-accent ring-offset-2 ring-offset-background shadow-xl shadow-accent/25'
                                : 'hover:shadow-lg hover:-translate-y-0.5'
                            }`}
                            onClick={() => setSelectedSize(size.id)}
                          >
                            {/* Background Gradient */}
                            <div className={`absolute inset-0 transition-all duration-500 ${
                              selectedSize === size.id
                                ? 'bg-gradient-to-r from-accent/15 via-orange-200/10 to-amber-100/15'
                                : 'bg-gradient-to-r from-card via-card/95 to-card/90 group-hover:from-accent/5 group-hover:to-amber-50/10'
                            }`} />
                            
                            {/* Animated Border */}
                            <div className={`absolute inset-0 rounded-xl transition-all duration-500 ${
                              selectedSize === size.id
                                ? 'border-2 border-accent'
                                : 'border border-border group-hover:border-accent/40'
                            }`} />
                            
                            {/* Content */}
                            <div className="relative p-4">
                              <div className="flex items-center justify-between">
                                {/* Left side - Radio and Info */}
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem 
                                    value={size.id} 
                                    id={size.id}
                                    className={`transition-colors duration-300 ${
                                      selectedSize === size.id ? 'border-accent text-accent' : 'border-muted-foreground'
                                    }`}
                                  />
                                  
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                      selectedSize === size.id
                                        ? 'bg-gradient-to-br from-accent to-amber-400 shadow-md'
                                        : 'bg-muted group-hover:bg-accent/20'
                                    }`}>
                                      <Ruler className={`h-4 w-4 transition-colors duration-300 ${
                                        selectedSize === size.id ? 'text-white' : 'text-muted-foreground group-hover:text-primary'
                                      }`} />
                                    </div>
                                    
                                    <Label htmlFor={size.id} className={`font-semibold cursor-pointer transition-colors duration-300 ${
                                      selectedSize === size.id ? 'text-accent' : 'text-foreground group-hover:text-accent'
                                    }`}>
                                      {size.name}
                                    </Label>
                                  </div>
                                </div>
                                
                                {/* Right side - Price and Check */}
                                <div className="flex items-center gap-3">
                                  <span className={`font-bold transition-colors duration-300 ${
                                    selectedSize === size.id ? 'text-amber-600' : 'text-muted-foreground group-hover:text-foreground'
                                  }`}>
                                    {size.price} ريال
                                  </span>
                                  
                                  {selectedSize === size.id && (
                                    <div className="w-6 h-6 bg-gradient-to-br from-accent to-amber-500 rounded-full flex items-center justify-center animate-scale-in shadow-md">
                                      <Check className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Glow Effect */}
                            {selectedSize === size.id && (
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent via-amber-400 to-accent rounded-xl opacity-25 blur-md animate-pulse" />
                            )}
                            
                            {/* Hover Shimmer Effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      {/* Custom Size Options */}
                      {selectedSize === 'custom' && (
                        <div className="mt-6 space-y-4">
                          <div className="text-center mb-4">
                            <h4 className="text-lg font-semibold text-foreground mb-2">اختر المقاس المخصص</h4>
                            <p className="text-sm text-muted-foreground">حدد الحجم المناسب من الخيارات المتاحة</p>
                          </div>
                          
                          <RadioGroup 
                            value={selectedCustomSize} 
                            onValueChange={setSelectedCustomSize}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                          >
                            {customSizeOptions.map((customSize) => (
                              <div
                                key={customSize.id}
                                className={`group relative overflow-hidden rounded-lg transition-all duration-300 cursor-pointer ${
                                  selectedCustomSize === customSize.id
                                    ? 'ring-2 ring-accent ring-offset-1 ring-offset-background shadow-lg shadow-accent/20'
                                    : 'hover:shadow-md hover:-translate-y-0.5'
                                }`}
                                onClick={() => setSelectedCustomSize(customSize.id)}
                              >
                                {/* Background */}
                                <div className={`absolute inset-0 transition-all duration-300 ${
                                  selectedCustomSize === customSize.id
                                    ? 'bg-gradient-to-r from-accent/10 via-primary/5 to-secondary/8'
                                    : 'bg-gradient-to-r from-card to-card/95 group-hover:from-accent/3 group-hover:to-primary/3'
                                }`} />
                                
                                {/* Border */}
                                <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                                  selectedCustomSize === customSize.id
                                    ? 'border-2 border-accent'
                                    : 'border border-border group-hover:border-accent/30'
                                }`} />
                                
                                {/* Content */}
                                <div className="relative p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem 
                                        value={customSize.id} 
                                        id={customSize.id}
                                        className={`transition-colors duration-300 ${
                                          selectedCustomSize === customSize.id ? 'border-accent text-accent' : 'border-muted-foreground'
                                        }`}
                                      />
                                      <Label htmlFor={customSize.id} className={`font-medium cursor-pointer transition-colors duration-300 ${
                                        selectedCustomSize === customSize.id ? 'text-accent' : 'text-foreground group-hover:text-accent'
                                      }`}>
                                        {customSize.name}
                                      </Label>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold transition-colors duration-300 ${
                                        selectedCustomSize === customSize.id ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'
                                      }`}>
                                        {customSize.price} ريال
                                      </span>
                                      
                                      {selectedCustomSize === customSize.id && (
                                        <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center animate-scale-in">
                                          <Check className="h-3 w-3 text-white" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Glow Effect */}
                                {selectedCustomSize === customSize.id && (
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-primary rounded-lg opacity-15 blur-sm" />
                                )}
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                    <Button
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={currentStep === 0}
                      className="flex items-center gap-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">الإجمالي</p>
                      <p className="text-2xl font-bold text-primary">{totalPrice} ريال</p>
                    </div>
                    
                    <Button
                      onClick={handleNextStep}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    >
                      {currentStep === wizardSteps.length - 1 ? 'إنهاء التخصيص' : 'التالي'}
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Conditional Shipping Section with Flip Animation */}
          {isCustomizationFinished && (
            <div className="mt-16 animate-fade-in">
              <div className="max-w-4xl mx-auto">
                <Card className="bg-gradient-to-br from-card via-card/95 to-primary/2 backdrop-blur-xl border border-primary/20 shadow-xl overflow-hidden rounded-2xl transform-style-3d">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                          <ShoppingBag className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold text-foreground">إتمام الطلب</CardTitle>
                          <CardDescription className="text-muted-foreground">أدخل بياناتك لإتمام عملية الشراء</CardDescription>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={handleBackToCustomization}
                        className="flex items-center gap-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                        تعديل التخصيص
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Shipping Information */}
                      <Card className="bg-gradient-to-br from-card via-card/95 to-primary/2 backdrop-blur-xl border border-primary/20 shadow-xl overflow-hidden rounded-2xl">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-primary/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                              <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-foreground">معلومات الشحن</CardTitle>
                              <CardDescription className="text-muted-foreground">أدخل بياناتك لإتمام الطلب</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div>
                            <Label htmlFor="address" className="text-sm font-semibold text-foreground mb-2 block">عنوان الشحن</Label>
                            <Textarea
                              id="address"
                              placeholder="أدخل عنوانك الكامل هنا..."
                              value={shippingAddress}
                              onChange={(e) => setShippingAddress(e.target.value)}
                              className="min-h-[100px] rounded-xl border-border focus:border-primary"
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone" className="text-sm font-semibold text-foreground mb-2 block">رقم الهاتف</Label>
                            <div className="relative">
                              <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="05xxxxxxxx"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="pr-10 rounded-xl border-border focus:border-primary"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Order Summary */}
                      <Card className="bg-gradient-to-br from-card via-card/95 to-accent/2 backdrop-blur-xl border border-accent/20 shadow-xl overflow-hidden rounded-2xl">
                        <CardHeader className="bg-gradient-to-r from-accent/5 to-secondary/5 border-b border-accent/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center shadow-lg">
                              <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-bold text-foreground">ملخص الطلب</CardTitle>
                              <CardDescription className="text-muted-foreground">تفاصيل طلبك والمبلغ الإجمالي</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          {/* Order Items */}
                          <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/20">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                                  <Palette className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{designTemplates.find(d => d.id === selectedDesign)?.name}</p>
                                  <p className="text-sm text-muted-foreground">تصميم الشجرة</p>
                                </div>
                              </div>
                              <span className="font-bold text-primary">{designPrice} ريال</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/5 to-secondary/5 rounded-xl border border-accent/20">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                                  <Frame className="h-5 w-5 text-accent" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{frameOptions.find(f => f.id === selectedFrame)?.name}</p>
                                  <p className="text-sm text-muted-foreground">نوع الإطار</p>
                                </div>
                              </div>
                              <span className="font-bold text-accent">{framePrice} ريال</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/8 to-amber-100/10 rounded-xl border border-accent/25">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-accent/30 to-amber-300/20 rounded-lg flex items-center justify-center">
                                  <Ruler className="h-5 w-5 text-accent" />
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{sizeDisplayName}</p>
                                  <p className="text-sm text-muted-foreground">حجم الطباعة</p>
                                </div>
                              </div>
                              <span className="font-bold text-amber-600">{sizePrice} ريال</span>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="border-t border-border pt-6">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-lg font-semibold text-foreground">المجموع الكلي</span>
                              <span className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">{totalPrice} ريال</span>
                            </div>
                            
                            <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-6 p-3 bg-green-50 rounded-xl border border-green-200">
                              <Check className="h-4 w-4" />
                              <span className="font-medium">الشحن مجاني لجميع أنحاء المملكة</span>
                            </div>
                            
                            <Button 
                              onClick={handleOrder}
                              className="w-full bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 text-white rounded-xl py-6 text-lg font-bold shadow-2xl transition-all duration-300 hover:shadow-3xl transform hover:scale-[1.02]"
                              size="lg"
                            >
                              <CreditCard className="h-6 w-6 mr-3" />
                              متابعة للدفع والطلب
                              <ArrowRight className="h-6 w-6 ml-3" />
                            </Button>
                            
                            <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
                              سيتم طباعة وشحن طلبك خلال 3-5 أيام عمل • ضمان الجودة • إمكانية الاستبدال
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
      </div>

      {/* Success Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-card to-accent/5 border border-primary/20 rounded-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
              <Check className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">تم تأكيد طلبك بنجاح!</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2">
              رقم الطلب: <span className="font-mono font-bold text-primary">{orderNumber}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-800 font-medium text-center">
                سيتم التواصل معك خلال 24 ساعة لتأكيد التفاصيل
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setOrderDialogOpen(false)}
              className="w-full bg-gradient-to-r from-primary to-accent text-white rounded-xl"
            >
              حسناً، شكراً لك
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}