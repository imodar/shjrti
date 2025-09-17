import React, { useState, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Upload, Camera, Crop, X, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import Cropper from 'react-easy-crop';
import { useToast } from '@/hooks/use-toast';

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MemberImageUploadFormProps {
  formData: {
    croppedImage: string | null;
  };
  onFormDataChange: (data: any) => void;
  className?: string;
}

export const MemberImageUploadForm: React.FC<MemberImageUploadFormProps> = ({
  formData,
  onFormDataChange,
  className
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image cropping states
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleInputChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: "يرجى اختيار ملف صورة صالح",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "يرجى اختيار صورة أصغر من 5 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImage(result);
      setShowImageCropper(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = useCallback(async (): Promise<string | null> => {
    if (!originalImage || !croppedAreaPixels) return null;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const image = new Image();
      image.src = originalImage;
      
      return new Promise((resolve) => {
        image.onload = () => {
          canvas.width = croppedAreaPixels.width;
          canvas.height = croppedAreaPixels.height;

          ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
          );

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }, 'image/jpeg', 0.8);
        };
      });
    } catch (error) {
      console.error('Error cropping image:', error);
      return null;
    }
  }, [originalImage, croppedAreaPixels]);

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg();
      if (croppedImage) {
        handleInputChange('croppedImage', croppedImage);
        setShowImageCropper(false);
        setOriginalImage(null);
        toast({
          title: "تم حفظ الصورة",
          description: "تم قص وحفظ الصورة بنجاح",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error saving cropped image:', error);
      toast({
        title: "خطأ في حفظ الصورة",
        description: "حدث خطأ أثناء معالجة الصورة",
        variant: "destructive"
      });
    }
  };

  const handleCropCancel = () => {
    setShowImageCropper(false);
    setOriginalImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageRemove = () => {
    handleInputChange('croppedImage', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "تم حذف الصورة",
      description: "تم حذف صورة العضو",
      variant: "default"
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-4">
        <Label className="font-arabic text-sm font-semibold text-foreground mb-3 block flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          صورة العضو
        </Label>
        
        {/* Image Preview and Upload */}
        <div className="flex flex-col items-center space-y-4">
          {/* Image Preview */}
          {formData.croppedImage ? (
            <div className="relative group">
              <div className="w-32 h-32 rounded-xl overflow-hidden border-4 border-primary/20 shadow-lg">
                <img 
                  src={formData.croppedImage} 
                  alt="صورة العضو" 
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleImageRemove}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Upload Button */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="font-arabic h-11 px-6 border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              <Upload className="h-4 w-4 ml-2" />
              {formData.croppedImage ? 'تغيير الصورة' : 'رفع صورة'}
            </Button>
            
            {formData.croppedImage && (
              <Button
                type="button"
                variant="outline"
                onClick={handleImageRemove}
                className="font-arabic h-11 px-6 border-2 border-destructive/20 hover:border-destructive/50 hover:bg-destructive/5 text-destructive transition-all duration-300"
              >
                <X className="h-4 w-4 ml-2" />
                حذف الصورة
              </Button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <p className="text-xs text-muted-foreground text-center font-arabic">
            صيغ مدعومة: JPG, PNG, GIF (حد أقصى: 5MB)
          </p>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <Dialog open={showImageCropper} onOpenChange={setShowImageCropper}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative bg-black">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-arabic font-semibold">قص الصورة</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCropCancel}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Cropper */}
            {originalImage && (
              <div className="relative w-full h-96 mt-16">
                <Cropper
                  image={originalImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="round"
                  showGrid={false}
                />
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/80 backdrop-blur p-4">
              <div className="space-y-4">
                {/* Zoom Control */}
                <div className="flex items-center gap-4">
                  <ZoomOut className="h-4 w-4 text-white" />
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={(value) => setZoom(value[0])}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4 text-white" />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCropCancel}
                    className="font-arabic"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCropSave}
                    className="font-arabic"
                  >
                    <Crop className="h-4 w-4 ml-2" />
                    حفظ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};