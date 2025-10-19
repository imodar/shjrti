import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a member's cropped image to Supabase Storage
 * @param croppedImageBlob - The cropped image blob
 * @param memberId - The member's ID (or temp ID for new members)
 * @returns The storage file path (not Base64!) or null if failed
 */
export const uploadMemberImage = async (
  croppedImageBlob: Blob,
  memberId: string
): Promise<string | null> => {
  try {
    // Generate unique filename
    const fileExt = 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${memberId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('member-memories')
      .upload(filePath, croppedImageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    console.log('✅ Image uploaded to storage:', filePath);
    return filePath; // Return storage path, not Base64!
  } catch (error) {
    console.error('Image upload failed:', error);
    return null;
  }
};

/**
 * Get a signed URL for a member's image from storage
 * @param filePath - The storage file path
 * @returns The signed URL or null if failed
 */
export const getMemberImageUrl = async (filePath: string): Promise<string | null> => {
  try {
    // If it's a Base64 string (legacy data), return as-is
    if (filePath.startsWith('data:image/')) {
      return filePath;
    }

    const { data } = await supabase.storage
      .from('member-memories')
      .createSignedUrl(filePath, 60 * 60); // 1 hour
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Failed to get image URL:', error);
    return null;
  }
};

/**
 * Delete a member's image from storage
 * @param filePath - The storage file path
 * @returns True if deletion was successful
 */
export const deleteMemberImage = async (filePath: string): Promise<boolean> => {
  try {
    // Don't try to delete Base64 strings (legacy data)
    if (filePath.startsWith('data:image/')) {
      return true;
    }

    const { error } = await supabase.storage
      .from('member-memories')
      .remove([filePath]);
    
    if (error) {
      console.error('Storage delete error:', error);
      return false;
    }

    console.log('✅ Image deleted from storage:', filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
};
