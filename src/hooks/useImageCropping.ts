import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCroppingResult {
  selectedImage: string | null;
  croppedImage: string | null;
  showCropDialog: boolean;
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: CropArea | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadLoading: boolean;
  handleImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditImage: () => void;
  handleDeleteImage: () => void;
  setShowCropDialog: (show: boolean) => void;
  setCrop: (crop: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  handleCropSave: () => Promise<void>;
  resetImage: () => void;
}

export const useImageCropping = (): ImageCroppingResult => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: CropArea): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        const fileReader = new FileReader();
        fileReader.readAsDataURL(blob);
        fileReader.onload = () => resolve(fileReader.result as string);
      }, 'image/jpeg', 0.8);
    });
  };

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الصورة أقل من 10 ميجابايت",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result as string);
        setShowCropDialog(true);
      });
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const handleEditImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDeleteImage = useCallback(() => {
    setCroppedImage(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = useCallback(async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    try {
      setUploadLoading(true);
      const croppedImageUrl = await getCroppedImg(selectedImage, croppedAreaPixels);
      setCroppedImage(croppedImageUrl);
      setShowCropDialog(false);
      
      toast({
        title: "تم اقتصاص الصورة بنجاح",
        description: "تم حفظ الصورة المقصوصة",
      });
    } catch (error) {
      toast({
        title: "خطأ في معالجة الصورة",
        description: "حدث خطأ أثناء اقتصاص الصورة",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  }, [selectedImage, croppedAreaPixels, toast]);

  const resetImage = useCallback(() => {
    setSelectedImage(null);
    setCroppedImage(null);
    setShowCropDialog(false);
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
    crop,
    zoom,
    croppedAreaPixels,
    fileInputRef,
    uploadLoading,
    handleImageSelect,
    handleEditImage,
    handleDeleteImage,
    setShowCropDialog,
    setCrop,
    setZoom,
    onCropComplete,
    handleCropSave,
    resetImage
  };
};