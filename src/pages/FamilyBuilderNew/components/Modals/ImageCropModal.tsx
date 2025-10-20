import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedImage: string | null;
  crop: { x: number; y: number };
  zoom: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
}

export const ImageCropModal = React.memo(({
  isOpen,
  onClose,
  onSave,
  selectedImage,
  crop,
  zoom,
  onCropChange,
  onZoomChange,
  onCropComplete
}: ImageCropModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>قص الصورة</DialogTitle>
          <DialogDescription>
            قم بتعديل موضع وحجم الصورة
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[400px] bg-muted">
          {selectedImage && (
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={onCropChange}
              onCropComplete={onCropComplete}
              onZoomChange={onZoomChange}
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">التكبير</label>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(value) => onZoomChange(value[0])}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={onSave}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ImageCropModal.displayName = "ImageCropModal";