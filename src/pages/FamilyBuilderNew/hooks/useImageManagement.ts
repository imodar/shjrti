import { useState, useRef, useCallback } from "react";

export interface ImageManagementState {
  selectedImage: string | null;
  croppedImage: string | null;
  showCropDialog: boolean;
  imageChanged: boolean;
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: any;
}

export const useImageManagement = () => {
  // Image Upload and Crop States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const [crop, setCrop] = useState({
    x: 0,
    y: 0
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Utility Functions
  const createImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const image = document.createElement('img');
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise<string>(resolve => {
      canvas.toBlob(blob => {
        if (!blob) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string));
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  // Event Handlers
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleCropSave = async () => {
    if (selectedImage && croppedAreaPixels) {
      const croppedImg = await getCroppedImg(selectedImage, croppedAreaPixels);
      if (croppedImg) {
        setCroppedImage(croppedImg);
        setImageChanged(true);
        setShowCropDialog(false);
      }
    }
  };

  const handleDeleteImage = () => {
    setCroppedImage(null);
    setSelectedImage(null);
    setImageChanged(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditImage = () => {
    if (selectedImage) {
      setShowCropDialog(true);
    }
  };

  const resetImageState = () => {
    setCroppedImage(null);
    setSelectedImage(null);
    setImageChanged(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const initializeImage = (imageUrl?: string) => {
    if (imageUrl) {
      setCroppedImage(imageUrl);
      setSelectedImage(imageUrl);
    }
  };

  return {
    // States
    selectedImage,
    croppedImage,
    showCropDialog,
    imageChanged,
    crop,
    zoom,
    croppedAreaPixels,
    fileInputRef,
    
    // Setters
    setSelectedImage,
    setCroppedImage,
    setShowCropDialog,
    setImageChanged,
    setCrop,
    setZoom,
    setCroppedAreaPixels,
    
    // Handlers
    onCropComplete,
    handleImageSelect,
    handleCropSave,
    handleDeleteImage,
    handleEditImage,
    resetImageState,
    initializeImage,
    
    // Utils
    createImage,
    getCroppedImg
  };
};