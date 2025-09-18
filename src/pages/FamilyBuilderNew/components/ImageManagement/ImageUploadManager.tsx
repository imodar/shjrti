import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Edit, Trash2, Upload } from "lucide-react";
import { useImageManagement } from "../../hooks/useImageManagement";
import { ImageCropDialog } from "./ImageCropDialog";
import { useImageUploadPermission } from "@/hooks/useImageUploadPermission";

interface ImageUploadManagerProps {
  currentImage?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  memberName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ImageUploadManager: React.FC<ImageUploadManagerProps> = ({
  currentImage,
  onImageChange,
  memberName = "العضو",
  size = "md",
  className = ""
}) => {
  const {
    selectedImage,
    croppedImage,
    showCropDialog,
    crop,
    zoom,
    fileInputRef,
    setCrop,
    setZoom,
    onCropComplete,
    handleImageSelect,
    handleCropSave,
    handleDeleteImage,
    handleEditImage,
    setShowCropDialog,
    initializeImage
  } = useImageManagement();

  const { isImageUploadEnabled } = useImageUploadPermission();

  // Initialize with current image when component mounts or currentImage changes
  React.useEffect(() => {
    if (currentImage && currentImage !== croppedImage) {
      initializeImage(currentImage);
    }
  }, [currentImage]);

  // Sync changes with parent component
  React.useEffect(() => {
    if (croppedImage !== currentImage) {
      onImageChange(croppedImage);
    }
  }, [croppedImage, onImageChange]);

  const handleSave = async () => {
    await handleCropSave();
  };

  const handleDelete = () => {
    handleDeleteImage();
    onImageChange(null);
  };

  const handleEdit = () => {
    if (croppedImage) {
      handleEditImage();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isImageUploadEnabled) {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={currentImage || ""} />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
            {getInitials(memberName)}
          </AvatarFallback>
        </Avatar>
        <p className="text-xs text-muted-foreground text-center">
          رفع الصور غير متاح في باقتك الحالية
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        {/* Image Display */}
        <div className="relative group">
          <Avatar className={`${sizeClasses[size]} border-4 border-border`}>
            <AvatarImage src={croppedImage || currentImage || ""} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
              {getInitials(memberName)}
            </AvatarFallback>
          </Avatar>
          
          {/* Overlay for existing image */}
          {(croppedImage || currentImage) && (
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {!croppedImage && !currentImage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              رفع صورة
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                تعديل
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerFileInput}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                تغيير
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* Crop Dialog */}
      <ImageCropDialog
        open={showCropDialog}
        onOpenChange={setShowCropDialog}
        selectedImage={selectedImage}
        crop={crop}
        zoom={zoom}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
        onSave={handleSave}
      />
    </>
  );
};