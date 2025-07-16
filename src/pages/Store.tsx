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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950" dir="rtl">
      {/* Header */}
      <div className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                  متجر الطباعة
                </h1>
                <p className="text-emerald-600 dark:text-emerald-400">
                  اطبع شجرة عائلتك بأجمل التصاميم
                </p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button variant="outline">
                العودة للوحة التحكم
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Design Selection */}
          <div className="lg:col-span-2 space-y-8">
            {/* Design Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  اختر تصميم الشجرة
                </CardTitle>
                <CardDescription>
                  اختر من بين تصاميمنا المتنوعة لشجرة عائلتك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedDesign} onValueChange={setSelectedDesign}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {designTemplates.map((design) => (
                      <div key={design.id} className="relative">
                        <RadioGroupItem value={design.id} id={design.id} className="sr-only" />
                        <label
                          htmlFor={design.id}
                          className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedDesign === design.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-4xl">{design.image}</div>
                            {design.isPremium && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Crown className="h-3 w-3 mr-1" />
                                مميز
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold">{design.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {design.price === 0 ? 'مجاني' : `${design.price} ريال`}
                          </p>
                          {selectedDesign === design.id && (
                            <Check className="absolute top-2 left-2 h-5 w-5 text-emerald-600" />
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Frame Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Frame className="h-5 w-5" />
                  اختر الإطار
                </CardTitle>
                <CardDescription>
                  أضف لمسة جمالية لشجرة عائلتك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedFrame} onValueChange={setSelectedFrame}>
                  <div className="space-y-3">
                    {frameOptions.map((frame) => (
                      <div key={frame.id} className="relative">
                        <RadioGroupItem value={frame.id} id={frame.id} className="sr-only" />
                        <label
                          htmlFor={frame.id}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedFrame === frame.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <h3 className="font-semibold">{frame.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {frame.price === 0 ? 'مجاني' : `${frame.price} ريال إضافي`}
                            </p>
                          </div>
                          {selectedFrame === frame.id && (
                            <Check className="h-5 w-5 text-emerald-600" />
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Size Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  اختر المقاس
                </CardTitle>
                <CardDescription>
                  حدد المقاس المناسب لمساحتك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                  <div className="space-y-3">
                    {sizeOptions.map((size) => (
                      <div key={size.id} className="relative">
                        <RadioGroupItem value={size.id} id={size.id} className="sr-only" />
                        <label
                          htmlFor={size.id}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedSize === size.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <h3 className="font-semibold">{size.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {size.price} ريال
                            </p>
                          </div>
                          {selectedSize === size.id && (
                            <Check className="h-5 w-5 text-emerald-600" />
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  معلومات الشحن
                </CardTitle>
                <CardDescription>
                  أدخل عنوان الشحن ورقم الجوال للتواصل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">عنوان الشحن</Label>
                  <Textarea
                    id="address"
                    placeholder="أدخل عنوان الشحن الكامل مع رقم المبنى والحي والمدينة"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    رقم الجوال
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  ملخص الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected items summary */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>التصميم:</span>
                    <span className="font-semibold">
                      {designTemplates.find(d => d.id === selectedDesign)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>الإطار:</span>
                    <span className="font-semibold">
                      {frameOptions.find(f => f.id === selectedFrame)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المقاس:</span>
                    <span className="font-semibold">
                      {sizeOptions.find(s => s.id === selectedSize)?.name}
                    </span>
                  </div>
                </div>

                <hr />

                {/* Price breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>سعر التصميم</span>
                    <span>{designPrice} ريال</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>سعر الإطار</span>
                    <span>{framePrice} ريال</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>سعر المقاس</span>
                    <span>{sizePrice} ريال</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>الشحن</span>
                    <span className="text-emerald-600">مجاني</span>
                  </div>
                </div>

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>المجموع الكلي</span>
                  <span className="text-emerald-600">{totalPrice} ريال</span>
                </div>

                <Button 
                  onClick={handleOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
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
      </div>

      {/* Success Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 text-center py-4 flex items-center justify-center gap-2">
              <Check className="h-6 w-6" />
              تم إرسال الطلب بنجاح!
            </DialogTitle>
            <DialogDescription className="text-center space-y-4">
              <div className="text-lg font-semibold">رقم الطلب: {orderNumber}</div>
              <p>
                شكراً لك على طلبك! سيتم التواصل معك خلال 24 ساعة لتأكيد التفاصيل وموعد الشحن.
              </p>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                <p className="text-sm">
                  سيتم إرسال رسالة تأكيد عبر الرقم: {phoneNumber}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              onClick={() => setOrderDialogOpen(false)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              ممتاز
            </Button>
            <Link to="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                العودة للوحة التحكم
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}