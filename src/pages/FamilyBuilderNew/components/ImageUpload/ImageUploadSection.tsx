import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Edit, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadSectionProps {
  croppedImage: string | null;
  currentImage?: string | null;
  onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEditImage: () => void;
  onDeleteImage: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isImageUploadEnabled: boolean;
  loading?: boolean;
  className?: string;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  croppedImage,
  currentImage,
  onImageSelect,
  onEditImage,
  onDeleteImage,
  fileInputRef,
  isImageUploadEnabled,
  loading,
  className
}) => {
  const displayImage = croppedImage || currentImage;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Image Display Area */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-dashed border-muted-foreground">
            {displayImage ? (
              <AvatarImage src={displayImage} alt="صورة العضو" />
            ) : (
              <AvatarFallback>
                <Camera className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            )}
          </Avatar>
          
          {isImageUploadEnabled && (
            <Button
              size="sm"
              variant="secondary"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Image Actions */}
        {isImageUploadEnabled && displayImage && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onEditImage}
              disabled={loading}
            >
              <Edit className="h-4 w-4 mr-2" />
              تعديل
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDeleteImage}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف
            </Button>
          </div>
        )}

        {/* Upload Button (when no image) */}
        {isImageUploadEnabled && !displayImage && (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            رفع صورة
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        onChange={onImageSelect}
        ref={fileInputRef}
        className="hidden"
      />
    </div>
  );
};