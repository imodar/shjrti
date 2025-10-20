import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { uploadMemberImage, deleteMemberImage } from "@/utils/imageUpload";
import { supabase } from "@/integrations/supabase/client";

const createImage = (url: string): Promise<HTMLImageElement> => 
  new Promise((resolve, reject) => {
    const image = document.createElement('img');
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const MAX_SIZE = 1200;
  const scale = Math.min(MAX_SIZE / pixelCrop.width, MAX_SIZE / pixelCrop.height, 1);
  
  canvas.width = pixelCrop.width * scale;
  canvas.height = pixelCrop.height * scale;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise<Blob | null>(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8);
  });
};

export const useImageUpload = () => {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setShowCropDialog(true);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  const handleCropSave = useCallback(async () => {
    if (selectedImage && croppedAreaPixels) {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (croppedBlob) {
        const previewUrl = URL.createObjectURL(croppedBlob);
        setCroppedImage(previewUrl);
        setImageChanged(true);
        setShowCropDialog(false);
        (window as any).__croppedImageBlob = croppedBlob;
      }
    }
  }, [selectedImage, croppedAreaPixels]);

  const handleDeleteImage = useCallback(async (memberId?: string, currentImageUrl?: string) => {
    try {
      if (croppedImage && croppedImage.startsWith('blob:')) {
        URL.revokeObjectURL(croppedImage);
      }

      if (currentImageUrl && !currentImageUrl.startsWith('data:image/') && !currentImageUrl.startsWith('blob:')) {
        await deleteMemberImage(currentImageUrl);
      }

      if (memberId) {
        await supabase
          .from('family_tree_members')
          .update({ image_url: null, updated_at: new Date().toISOString() })
          .eq('id', memberId);
      }

      setCroppedImage(null);
      setSelectedImage(null);
      setImageChanged(true);
      (window as any).__croppedImageBlob = null;

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: 'تم حذف الصورة',
        description: 'تم حذف صورة العضو بنجاح',
      });
    } catch (err) {
      console.error('Failed to delete image', err);
      toast({
        title: 'فشل حذف الصورة',
        description: 'حدث خطأ أثناء حذف الصورة',
        variant: 'destructive',
      });
    }
  }, [croppedImage, toast]);

  const handleEditImage = useCallback(() => {
    if (selectedImage) {
      setShowCropDialog(true);
    } else if (croppedImage) {
      fileInputRef.current?.click();
    }
  }, [selectedImage, croppedImage]);

  const resetImageState = useCallback(() => {
    setSelectedImage(null);
    setCroppedImage(null);
    setImageChanged(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    selectedImage,
    croppedImage,
    showCropDialog,
    imageChanged,
    crop,
    zoom,
    croppedAreaPixels,
    fileInputRef,
    setSelectedImage,
    setCroppedImage,
    setShowCropDialog,
    setImageChanged,
    setCrop,
    setZoom,
    onCropComplete,
    handleImageSelect,
    handleCropSave,
    handleDeleteImage,
    handleEditImage,
    resetImageState
  };
};