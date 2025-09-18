import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedImage: string | null;
  crop: { x: number; y: number };
  zoom: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  onSave: () => Promise<void>;
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  onOpenChange,
  selectedImage,
  crop,
  zoom,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onSave
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>اقتصاص الصورة</DialogTitle>
          <DialogDescription>
            استخدم الأدوات أدناه لاقتصاص وتعديل الصورة كما تريد
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {selectedImage && (
            <div className="relative h-96">
              <Cropper 
                image={selectedImage} 
                crop={crop} 
                zoom={zoom} 
                aspect={1} 
                onCropChange={onCropChange} 
                onCropComplete={onCropComplete} 
                onZoomChange={onZoomChange} 
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>التكبير</Label>
            <Slider 
              value={[zoom]} 
              onValueChange={value => onZoomChange(value[0])} 
              min={1} 
              max={3} 
              step={0.1} 
              className="w-full" 
            />
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onSave}>
            حفظ الصورة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};