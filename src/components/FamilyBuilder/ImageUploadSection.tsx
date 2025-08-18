import React from "react";
import { Upload, Edit2, Trash2, X, Camera, Crop, Star, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";

interface ImageUploadSectionProps {
  isImageUploadEnabled: boolean;
  uploadLoading: boolean;
  croppedImage: string | null;
  selectedImage: string | null;
  showCropDialog: boolean;
  crop: { x: number; y: number };
  zoom: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleEditImage: () => void;
  handleDeleteImage: () => void;
  handleImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setShowCropDialog: (show: boolean) => void;
  setCrop: (crop: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  handleCropSave: () => void;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  isImageUploadEnabled,
  uploadLoading,
  croppedImage,
  selectedImage,
  showCropDialog,
  crop,
  zoom,
  fileInputRef,
  handleEditImage,
  handleDeleteImage,
  handleImageSelect,
  setShowCropDialog,
  setCrop,
  setZoom,
  onCropComplete,
  handleCropSave
}) => {
  const tooltipContent = isImageUploadEnabled 
    ? "انقر لرفع صورة شخصية للعضو" 
    : "رفع الصور متاح فقط للمشتركين في الخطط المدفوعة. قم بترقية اشتراكك لتفعيل هذه الميزة.";

  if (uploadLoading) {
    return (
      <div className="space-y-3">
        <Label htmlFor="picture" className="text-sm font-medium text-foreground">الصورة الشخصية</Label>
        <div className="relative border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-gradient-to-br from-background to-muted/30 transition-all duration-300">
          <div className="space-y-3">
            <div className="relative">
              <Upload className="h-16 w-16 mx-auto text-primary/60 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 rounded-full blur-xl opacity-50 animate-pulse"></div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">جاري التحقق من الصلاحيات...</p>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <Label htmlFor="picture" className="text-sm font-medium text-foreground">الصورة الشخصية</Label>
      
      {croppedImage ? (
        <div className="space-y-3">
          <div className="relative group flex justify-center">
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20 p-3 transition-all duration-300 hover:border-primary/40 hover:shadow-lg">
              <div className="relative inline-block">
                <img 
                  src={croppedImage} 
                  alt="صورة العضو" 
                  className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="absolute top-1 left-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-arabic">تم الرفع</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleEditImage}
              className="h-8 px-3 bg-white/90 hover:bg-white border border-gray-200 shadow-sm backdrop-blur-sm font-arabic"
            >
              <Edit2 className="h-3 w-3 ml-1" />
              تعديل
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleDeleteImage}
              className="h-8 px-3 bg-red-500/90 hover:bg-red-600 shadow-sm backdrop-blur-sm font-arabic"
            >
              <Trash2 className="h-3 w-3 ml-1" />
              حذف
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center font-arabic">انقر على الأزرار لتعديل أو حذف الصورة</p>
        </div>
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-300 ${
                  isImageUploadEnabled 
                    ? 'border-primary/40 cursor-pointer hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0' 
                    : 'border-gray-300 opacity-70 cursor-not-allowed bg-gradient-to-br from-gray-50 to-gray-100'
                }`}
                onClick={() => isImageUploadEnabled && fileInputRef.current?.click()}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-50"></div>
                
                {isImageUploadEnabled ? (
                  <div className="relative space-y-2">
                    <div className="relative">
                      <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl w-fit mx-auto">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 rounded-xl blur-xl opacity-30 animate-pulse"></div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground font-arabic">انقر لرفع الصورة</p>
                      <p className="text-xs text-muted-foreground font-arabic">PNG, JPG, GIF حتى 10MB</p>
                    </div>
                    
                    <div className="flex justify-center items-center space-x-2 pt-1">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Camera className="h-3 w-3 text-primary" />
                        <span className="font-arabic">عالية الجودة</span>
                      </div>
                      <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Crop className="h-3 w-3 text-primary" />
                        <span className="font-arabic">قص تلقائي</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative space-y-2">
                    <div className="relative">
                      <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl w-fit mx-auto">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500 font-arabic">رفع الصور غير متاح</p>
                      <p className="text-xs text-gray-400 font-arabic">يتطلب اشتراك مدفوع</p>
                    </div>
                    
                    <div className="pt-1">
                      <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-primary to-primary/80 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        <Star className="h-3 w-3" />
                        <span className="font-arabic">ترقية الاشتراك</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className={`max-w-xs p-3 ${isImageUploadEnabled ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-r from-primary to-primary/80 text-white'} border-0 shadow-xl`}
            >
              <div className="space-y-1">
                <p className="font-medium">{tooltipContent}</p>
                {!isImageUploadEnabled && (
                  <p className="text-xs opacity-90">انقر لمعرفة المزيد عن الخطط المتاحة</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        disabled={!isImageUploadEnabled}
      />
      
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-md bg-gradient-to-br from-background to-muted/20 border-2 border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <Crop className="h-5 w-5 text-primary" />
              تعديل الصورة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {selectedImage && (
              <div className="relative h-64 bg-black rounded-xl overflow-hidden border-2 border-primary/20 shadow-xl">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      position: 'relative'
                    }
                  }}
                />
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">التكبير</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCropDialog(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleCropSave}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Save className="h-4 w-4 mr-2" />
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};