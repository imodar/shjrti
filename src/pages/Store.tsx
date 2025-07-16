import { useState } from "react";
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
  Crown
} from "lucide-react";
import { Link } from "react-router-dom";

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

export default function Store() {
  const [selectedDesign, setSelectedDesign] = useState('classic');
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [selectedSize, setSelectedSize] = useState('A4');
  const [shippingAddress, setShippingAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderNumber] = useState(`ORD-${Date.now()}`);

  // Calculate total price
  const designPrice = designTemplates.find(d => d.id === selectedDesign)?.price || 0;
  const framePrice = frameOptions.find(f => f.id === selectedFrame)?.price || 0;
  const sizePrice = sizeOptions.find(s => s.id === selectedSize)?.price || 0;
  const totalPrice = designPrice + framePrice + sizePrice;

  const handleOrder = () => {
    if (!shippingAddress.trim() || !phoneNumber.trim()) {
      alert('يرجى ملء جميع البيانات المطلوبة');
      return;
    }
    
    // In a real app, this would redirect to payment gateway
    // For now, we'll show success dialog
    setOrderDialogOpen(true);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/10 relative overflow-hidden">
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
      <div className="pt-8 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
            {/* Live Preview Section */}
            <div className="xl:col-span-2 space-y-6">
              <div className="sticky top-24">
                <Card className="bg-card/50 backdrop-blur-xl border border-primary/20 shadow-xl overflow-hidden">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-foreground">
                      <TreePine className="h-6 w-6 text-primary" />
                      معاينة مباشرة
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      شاهد كيف ستبدو شجرة عائلتك
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    {/* Live Tree Preview */}
                    <div className="relative bg-gradient-to-br from-background to-accent/5 rounded-2xl p-8 border-2 border-dashed border-primary/20 min-h-[400px] flex items-center justify-center">
                      {/* Frame Effect */}
                      <div 
                        className={`absolute inset-0 rounded-2xl ${
                          selectedFrame === 'wood' ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-8 border-amber-400' :
                          selectedFrame === 'gold' ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-8 border-yellow-500' :
                          selectedFrame === 'silver' ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-8 border-gray-400' :
                          selectedFrame === 'premium' ? 'bg-gradient-to-br from-purple-100 to-purple-200 border-8 border-purple-500' :
                          'bg-transparent'
                        }`}
                      />
                      
                      {/* Tree Design Preview */}
                      <div className="relative z-10 flex flex-col items-center">
                        {/* Tree Design Based on Selection */}
                        {selectedDesign === 'classic' && (
                          <div className="text-center space-y-4">
                            <div className="text-6xl animate-bounce">🌳</div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs">👨</div>
                              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs">👩</div>
                              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-xs">👶</div>
                            </div>
                          </div>
                        )}
                        
                        {selectedDesign === 'modern' && (
                          <div className="text-center space-y-4">
                            <div className="text-6xl animate-pulse">🌲</div>
                            <div className="flex flex-col items-center space-y-2">
                              <div className="flex space-x-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold">A</div>
                                <div className="w-10 h-10 bg-gradient-to-r from-accent to-secondary rounded-lg flex items-center justify-center text-white font-bold">B</div>
                              </div>
                              <div className="w-10 h-10 bg-gradient-to-r from-secondary to-primary rounded-lg flex items-center justify-center text-white font-bold">C</div>
                            </div>
                          </div>
                        )}
                        
                        {selectedDesign === 'vintage' && (
                          <div className="text-center space-y-4 filter sepia">
                            <div className="text-6xl animate-pulse">🍃</div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="w-12 h-12 bg-amber-200 border-2 border-amber-600 rounded-full flex items-center justify-center text-amber-800">♂</div>
                              <div className="w-12 h-12 bg-pink-200 border-2 border-pink-600 rounded-full flex items-center justify-center text-pink-800">♀</div>
                            </div>
                          </div>
                        )}
                        
                        {selectedDesign === 'elegant' && (
                          <div className="text-center space-y-4">
                            <div className="text-6xl animate-pulse text-primary">🌿</div>
                            <div className="flex flex-col items-center space-y-3">
                              <div className="w-16 h-4 bg-gradient-to-r from-primary via-accent to-secondary rounded-full"></div>
                              <div className="flex space-x-4">
                                <div className="w-4 h-16 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                                <div className="w-4 h-16 bg-gradient-to-b from-accent to-secondary rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Size Indicator */}
                        <div className="mt-6 text-center">
                          <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary font-medium">
                            {sizeOptions.find(s => s.id === selectedSize)?.name}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Animated Background */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-4 right-4 w-2 h-2 bg-primary/30 rounded-full animate-ping"></div>
                        <div className="absolute bottom-8 left-6 w-3 h-3 bg-accent/30 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                        <div className="absolute top-12 left-12 w-1 h-1 bg-secondary/30 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
                      </div>
                    </div>
                    
                    {/* Preview Info */}
                    <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">التصميم المحدد:</span>
                        <span className="font-medium text-primary">
                          {designTemplates.find(d => d.id === selectedDesign)?.name}
                        </span>
                      </div>
                      {selectedFrame !== 'none' && (
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-muted-foreground">الإطار:</span>
                          <span className="font-medium text-primary">
                            {frameOptions.find(f => f.id === selectedFrame)?.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Configuration Section */}
            <div className="xl:col-span-2 space-y-6">
              {/* Design Templates */}
              <Card className="bg-card/50 backdrop-blur-xl border border-primary/20 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Palette className="h-5 w-5 text-primary" />
                    اختر تصميم الشجرة
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    اختر من بين تصاميمنا المتنوعة لشجرة عائلتك
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup value={selectedDesign} onValueChange={setSelectedDesign}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {designTemplates.map((design) => (
                        <div key={design.id} className="relative group">
                          <RadioGroupItem value={design.id} id={design.id} className="sr-only" />
                          <label
                            htmlFor={design.id}
                            className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group-hover:scale-105 ${
                              selectedDesign === design.id
                                ? 'border-primary bg-primary/10 shadow-lg transform scale-105'
                                : 'border-border hover:border-primary/50 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-4xl group-hover:scale-110 transition-transform">{design.image}</div>
                              {design.isPremium && (
                                <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border border-accent/30">
                                  <Crown className="h-3 w-3 mr-1" />
                                  مميز
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-foreground">{design.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {design.price === 0 ? 'مجاني' : `${design.price} ريال`}
                            </p>
                            {selectedDesign === design.id && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Frame Selection */}
              <Card className="bg-card/50 backdrop-blur-xl border border-primary/20 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-accent/5 to-secondary/5">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Frame className="h-5 w-5 text-primary" />
                    اختر الإطار
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    أضف لمسة جمالية لشجرة عائلتك
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup value={selectedFrame} onValueChange={setSelectedFrame}>
                    <div className="space-y-3">
                      {frameOptions.map((frame) => (
                        <div key={frame.id} className="relative group">
                          <RadioGroupItem value={frame.id} id={frame.id} className="sr-only" />
                          <label
                            htmlFor={frame.id}
                            className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group-hover:shadow-md ${
                              selectedFrame === frame.id
                                ? 'border-primary bg-primary/10 shadow-lg'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg border-2 ${
                                frame.id === 'wood' ? 'bg-amber-200 border-amber-400' :
                                frame.id === 'gold' ? 'bg-yellow-200 border-yellow-500' :
                                frame.id === 'silver' ? 'bg-gray-200 border-gray-400' :
                                frame.id === 'premium' ? 'bg-purple-200 border-purple-500' :
                                'bg-transparent border-dashed border-gray-300'
                              }`}></div>
                              <div>
                                <h3 className="font-semibold text-foreground">{frame.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {frame.price === 0 ? 'مجاني' : `${frame.price} ريال إضافي`}
                                </p>
                              </div>
                            </div>
                            {selectedFrame === frame.id && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Size Selection */}
              <Card className="bg-card/50 backdrop-blur-xl border border-primary/20 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-secondary/5 to-primary/5">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Ruler className="h-5 w-5 text-primary" />
                    اختر المقاس
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    حدد المقاس المناسب لمساحتك
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sizeOptions.map((size) => (
                        <div key={size.id} className="relative group">
                          <RadioGroupItem value={size.id} id={size.id} className="sr-only" />
                          <label
                            htmlFor={size.id}
                            className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 group-hover:shadow-md ${
                              selectedSize === size.id
                                ? 'border-primary bg-primary/10 shadow-lg'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className={`w-12 h-16 border-2 border-primary/30 rounded mb-2 relative ${
                              selectedSize === size.id ? 'bg-primary/5' : 'bg-background'
                            }`}>
                              <div className="absolute inset-1 border border-primary/20 rounded"></div>
                            </div>
                            <h3 className="font-semibold text-foreground text-center">{size.name}</h3>
                            <p className="text-sm text-primary font-medium">
                              {size.price} ريال
                            </p>
                            {selectedSize === size.id && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary - Right Column */}
            <div className="xl:col-span-1">
              <Card className="sticky top-24 bg-card/50 backdrop-blur-xl border border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Package className="h-5 w-5 text-primary" />
                    ملخص الطلب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected items summary */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">التصميم:</span>
                      <span className="font-semibold text-foreground">
                        {designTemplates.find(d => d.id === selectedDesign)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الإطار:</span>
                      <span className="font-semibold text-foreground">
                        {frameOptions.find(f => f.id === selectedFrame)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المقاس:</span>
                      <span className="font-semibold text-foreground">
                        {sizeOptions.find(s => s.id === selectedSize)?.name}
                      </span>
                    </div>
                  </div>

                  <hr className="border-border" />

                  {/* Price breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">سعر التصميم</span>
                      <span className="text-foreground">{designPrice} ريال</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">سعر الإطار</span>
                      <span className="text-foreground">{framePrice} ريال</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">سعر المقاس</span>
                      <span className="text-foreground">{sizePrice} ريال</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الشحن</span>
                      <span className="text-primary font-medium">مجاني</span>
                    </div>
                  </div>

                  <hr className="border-border" />

                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">المجموع الكلي</span>
                    <span className="text-primary">{totalPrice} ريال</span>
                  </div>

                  <Button 
                    onClick={handleOrder}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3"
                    size="lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    متابعة للدفع
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    سيتم طباعة وشحن الطلب خلال 3-5 أيام عمل
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Shipping Information - Full Width Section */}
          <div className="mt-12">
            <Card className="bg-card/50 backdrop-blur-xl border border-primary/20 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  معلومات الشحن
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  أدخل عنوان الشحن ورقم الجوال للتواصل
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="address" className="text-foreground font-medium">عنوان الشحن</Label>
                    <Textarea
                      id="address"
                      placeholder="أدخل عنوان الشحن الكامل مع رقم المبنى والحي والمدينة"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="min-h-[120px] bg-background/50 border-border focus:border-primary mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 text-foreground font-medium">
                      <Phone className="h-4 w-4" />
                      رقم الجوال
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="05xxxxxxxx"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-background/50 border-border focus:border-primary mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      سيتم التواصل معك على هذا الرقم لتأكيد الطلب
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border border-primary/20" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-primary text-center py-4 flex items-center justify-center gap-2">
              <Check className="h-6 w-6" />
              تم إرسال الطلب بنجاح!
            </DialogTitle>
            <DialogDescription className="text-center space-y-4">
              <div className="text-lg font-semibold text-foreground">رقم الطلب: {orderNumber}</div>
              <p className="text-muted-foreground">
                شكراً لك على طلبك! سيتم التواصل معك خلال 24 ساعة لتأكيد التفاصيل وموعد الشحن.
              </p>
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  سيتم إرسال رسالة تأكيد عبر الرقم: {phoneNumber}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              onClick={() => setOrderDialogOpen(false)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              ممتاز
            </Button>
            <Link to="/family-builder" className="flex-1">
              <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10">
                العودة لمنشئ الشجرة
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}