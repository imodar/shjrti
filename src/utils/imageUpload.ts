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
    if (!filePath) return null;

    // If it's a Base64/blob/http URL (legacy or direct), return as-is
    if (
      filePath.startsWith('data:image/') ||
      filePath.startsWith('blob:') ||
      filePath.startsWith('http://') ||
      filePath.startsWith('https://')
    ) {
      // If it's a Supabase storage HTTP URL, try to re-sign it for private buckets
      if (filePath.includes('/storage/v1/object/') && filePath.includes('member-memories')) {
        const bucketMarker = 'member-memories/';
        const idx = filePath.indexOf(bucketMarker);
        const relative = idx !== -1 ? filePath.substring(idx + bucketMarker.length) : filePath;
        const { data } = await supabase.storage
          .from('member-memories')
          .createSignedUrl(relative.replace(/^\/+/, ''), 60 * 60);
        return data?.signedUrl || filePath;
      }
      return filePath;
    }

    // Normalize storage-relative paths that might include bucket prefix
    let relativePath = filePath.replace(/^\/+/, '');
    const bucketMarker = 'member-memories/';
    const idx = relativePath.indexOf(bucketMarker);
    if (idx !== -1) {
      relativePath = relativePath.substring(idx + bucketMarker.length);
    }

    const { data } = await supabase.storage
      .from('member-memories')
      .createSignedUrl(relativePath, 60 * 60); // 1 hour
    
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
