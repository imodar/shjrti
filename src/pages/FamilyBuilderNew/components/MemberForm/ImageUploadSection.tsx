import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Edit2, Trash2 } from "lucide-react";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";

interface ImageUploadSectionProps {
  imageUrl?: string | null;
  croppedImage?: string | null;
  onImageChange: (imageUrl: string | null, croppedImage: string | null) => void;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  imageUrl,
  croppedImage,
  onImageChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isImageUploadEnabled, loading } = useImageUploadPermission();
  const [previewUrl, setPreviewUrl] = useState<string | null>(croppedImage || imageUrl || null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        onImageChange(result, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    setPreviewUrl(null);
    onImageChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isImageUploadEnabled && !loading) {
    return (
      <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
        رفع الصور غير متاح في الباقة الحالية
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="flex items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={previewUrl} alt="Preview" />
            <AvatarFallback>صورة</AvatarFallback>
          </Avatar>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              تغيير
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          رفع صورة
        </Button>
      )}
    </div>
  );
};