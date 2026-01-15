/**
 * Family Builder Service
 * Centralized service for family member operations using the API
 */

import { membersApi, marriagesApi } from '@/lib/api';
import type { MemberCreateInput, MemberUpdateInput, MarriageCreateInput } from '@/lib/api/types';
import { uploadMemberImage, deleteMemberImage } from '@/utils/imageUpload';
import { formatDateForDatabase } from '@/lib/dateUtils';

/**
 * Perform cascading delete of a member and all descendants
 */
export async function cascadingDeleteMember(
  memberId: string,
  familyId: string,
  familyMembers: any[],
  familyMarriages: any[]
): Promise<{ membersDeleted: number; marriagesDeleted: number }> {
  const membersToDelete = new Set<string>();
  const marriagesToDelete = new Set<string>();

  // Add the target member
  membersToDelete.add(memberId);

  // Add related marriages
  familyMarriages.forEach((marriage: any) => {
    if (marriage.husband_id === memberId || marriage.wife_id === memberId) {
      marriagesToDelete.add(marriage.id);
      // Also add spouse if they're external (not a blood member)
      const spouseId = marriage.husband_id === memberId ? marriage.wife_id : marriage.husband_id;
      const spouse = familyMembers.find(m => m.id === spouseId);
      if (spouse && !spouse.fatherId && !spouse.motherId && !spouse.isFounder) {
        membersToDelete.add(spouseId);
      }
    }
  });

  // Recursively find descendants
  const findDescendants = (parentId: string) => {
    familyMembers.forEach((child: any) => {
      if (child.fatherId === parentId || child.motherId === parentId) {
        membersToDelete.add(child.id);
        
        // Also add child's marriages
        familyMarriages.forEach((marriage: any) => {
          if (marriage.husband_id === child.id || marriage.wife_id === child.id) {
            marriagesToDelete.add(marriage.id);
            // Add external spouse
            const spouseId = marriage.husband_id === child.id ? marriage.wife_id : marriage.husband_id;
            const spouse = familyMembers.find(m => m.id === spouseId);
            if (spouse && !spouse.fatherId && !spouse.motherId && !spouse.isFounder) {
              membersToDelete.add(spouseId);
            }
          }
        });
        
        findDescendants(child.id);
      }
    });
  };

  findDescendants(memberId);

  // Delete marriages first (to avoid foreign key constraints)
  if (marriagesToDelete.size > 0) {
    await marriagesApi.batchDelete(Array.from(marriagesToDelete));
  }

  // Then delete family members
  if (membersToDelete.size > 0) {
    await membersApi.batchDelete(Array.from(membersToDelete));
  }

  return {
    membersDeleted: membersToDelete.size,
    marriagesDeleted: marriagesToDelete.size,
  };
}

/**
 * Create a new family member
 */
export async function createMember(
  data: {
    firstName: string;
    lastName: string;
    gender: string;
    birthDate?: string;
    isAlive?: boolean;
    deathDate?: string;
    biography?: string;
    fatherId?: string | null;
    motherId?: string | null;
    relatedPersonId?: string | null;
    isFounder?: boolean;
    maritalStatus?: string;
    isTwin?: boolean;
    twinGroupId?: string | null;
  },
  familyId: string,
  creatorId: string,
  imageBlob?: Blob | null
): Promise<any> {
  const fullName = data.firstName && data.lastName 
    ? `${data.firstName} ${data.lastName}` 
    : data.firstName;

  // Create member first (without image)
  const memberInput: MemberCreateInput = {
    name: fullName,
    first_name: data.firstName,
    last_name: data.lastName,
    gender: data.gender,
    birth_date: data.birthDate || undefined,
    is_alive: data.isAlive ?? true,
    death_date: !data.isAlive && data.deathDate ? data.deathDate : undefined,
    biography: data.biography || undefined,
    father_id: data.fatherId || undefined,
    mother_id: data.motherId || undefined,
    related_person_id: data.relatedPersonId || undefined,
    family_id: familyId,
    created_by: creatorId,
    is_founder: data.isFounder || false,
    marital_status: data.maritalStatus || 'single',
    is_twin: data.isTwin || false,
    twin_group_id: data.twinGroupId || undefined,
  };

  const newMember = await membersApi.create(memberInput);

  // Upload image if provided
  if (imageBlob) {
    try {
      const imagePath = await uploadMemberImage(imageBlob, newMember.id);
      if (imagePath) {
        await membersApi.updateImage(newMember.id, imagePath);
        newMember.image_url = imagePath;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      // Member created successfully, just without image
    }
  }

  return newMember;
}

/**
 * Update an existing family member
 */
export async function updateMember(
  memberId: string,
  data: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    birthDate?: string;
    isAlive?: boolean;
    deathDate?: string;
    biography?: string;
    fatherId?: string | null;
    motherId?: string | null;
    relatedPersonId?: string | null;
    maritalStatus?: string;
    isTwin?: boolean;
    twinGroupId?: string | null;
  },
  imageChanged: boolean = false,
  imageBlob?: Blob | null,
  existingImagePath?: string | null
): Promise<any> {
  let finalImageUrl = existingImagePath;

  // Handle image changes
  if (imageChanged) {
    // Upload new image if provided
    if (imageBlob) {
      try {
        finalImageUrl = await uploadMemberImage(imageBlob, memberId);
        
        // Delete old image if new upload successful
        if (finalImageUrl && existingImagePath && 
            !existingImagePath.startsWith('data:image/') && 
            !existingImagePath.startsWith('blob:')) {
          await deleteMemberImage(existingImagePath);
        }
      } catch (error) {
        console.error('Image upload error:', error);
        finalImageUrl = existingImagePath; // Keep existing
      }
    } else {
      // Image was deleted
      if (existingImagePath && 
          !existingImagePath.startsWith('data:image/') && 
          !existingImagePath.startsWith('blob:')) {
        await deleteMemberImage(existingImagePath);
      }
      finalImageUrl = null;
    }
  }

  const fullName = data.firstName && data.lastName 
    ? `${data.firstName} ${data.lastName}` 
    : data.firstName;

  const updateInput: MemberUpdateInput = {
    name: fullName,
    first_name: data.firstName,
    last_name: data.lastName,
    gender: data.gender,
    birth_date: data.birthDate || undefined,
    is_alive: data.isAlive,
    death_date: !data.isAlive && data.deathDate ? data.deathDate : null,
    biography: data.biography || null,
    image_url: finalImageUrl,
    father_id: data.fatherId,
    mother_id: data.motherId,
    related_person_id: data.relatedPersonId,
    marital_status: data.maritalStatus || 'single',
    is_twin: data.isTwin || false,
    twin_group_id: data.twinGroupId || null,
  };

  return await membersApi.update(memberId, updateInput);
}

/**
 * Create or update a marriage record
 */
export async function createOrUpdateMarriage(
  familyId: string,
  husbandId: string,
  wifeId: string,
  maritalStatus: string = 'married'
): Promise<any> {
  // The API will handle checking for existing marriages
  return await marriagesApi.create({
    family_id: familyId,
    husband_id: husbandId,
    wife_id: wifeId,
    is_active: true,
    marital_status: maritalStatus,
  });
}

/**
 * Delete a marriage and optionally the external spouse
 */
export async function deleteMarriage(
  marriageId: string,
  externalSpouseId?: string
): Promise<void> {
  await marriagesApi.delete(marriageId);
  
  if (externalSpouseId) {
    await membersApi.delete(externalSpouseId);
  }
}

/**
 * Delete spouse with marriage cleanup
 */
export async function deleteSpouseWithMarriage(
  spouseId: string,
  memberId: string,
  isFamilyMember: boolean,
  spouseGender: 'male' | 'female'
): Promise<void> {
  // Build the marriage query based on gender
  const marriageFilter = spouseGender === 'male' 
    ? { husband_id: spouseId, wife_id: memberId }
    : { husband_id: memberId, wife_id: spouseId };

  // Delete the marriage first - need to find marriage ID first
  // The API doesn't support querying by husband/wife IDs directly,
  // so we'll need to delete the member which triggers cascade
  
  if (isFamilyMember) {
    // Just update their marital status to single
    await membersApi.update(spouseId, { marital_status: 'single' });
  } else {
    // Delete the external spouse entirely (marriage will be cascade deleted)
    await membersApi.delete(spouseId);
  }
}

/**
 * Create or update spouse member (for external spouses)
 */
export async function createOrUpdateSpouse(
  spouseData: {
    id?: string;
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    birthDate?: Date | null;
    isAlive: boolean;
    deathDate?: Date | null;
    maritalStatus?: string;
    biography?: string;
    croppedImage?: string | null;
  },
  familyId: string,
  creatorId: string
): Promise<any> {
  const fullName = spouseData.firstName && spouseData.lastName 
    ? `${spouseData.firstName} ${spouseData.lastName}` 
    : spouseData.firstName || spouseData.lastName || '';

  // Check if we're updating an existing spouse or creating new
  if (spouseData.id && !spouseData.id.startsWith('temp_')) {
    // Update existing spouse
    return await membersApi.update(spouseData.id, {
      name: fullName,
      first_name: spouseData.firstName,
      last_name: spouseData.lastName,
      birth_date: spouseData.birthDate ? formatDateForDatabase(spouseData.birthDate) : undefined,
      is_alive: spouseData.isAlive,
      death_date: !spouseData.isAlive && spouseData.deathDate 
        ? formatDateForDatabase(spouseData.deathDate) 
        : null,
      marital_status: spouseData.maritalStatus || 'married',
      biography: spouseData.biography || null,
      image_url: spouseData.croppedImage || undefined,
    });
  } else {
    // Create new spouse
    return await membersApi.create({
      name: fullName,
      first_name: spouseData.firstName,
      last_name: spouseData.lastName,
      gender: spouseData.gender,
      birth_date: spouseData.birthDate ? formatDateForDatabase(spouseData.birthDate) : undefined,
      is_alive: spouseData.isAlive ?? true,
      death_date: !spouseData.isAlive && spouseData.deathDate 
        ? formatDateForDatabase(spouseData.deathDate) 
        : undefined,
      family_id: familyId,
      created_by: creatorId,
      is_founder: false,
      marital_status: spouseData.maritalStatus || 'married',
      biography: spouseData.biography || undefined,
      image_url: spouseData.croppedImage || undefined,
    });
  }
}

/**
 * Update member's twin group
 */
export async function updateTwinGroup(
  memberId: string,
  isTwin: boolean,
  twinGroupId: string | null,
  selectedTwins: string[]
): Promise<void> {
  // Update the main member
  await membersApi.update(memberId, {
    is_twin: isTwin,
    twin_group_id: twinGroupId,
  });

  // Update all selected twin siblings
  for (const siblingId of selectedTwins) {
    await membersApi.update(siblingId, {
      is_twin: true,
      twin_group_id: twinGroupId,
    });
  }
}

/**
 * Remove member from twin group
 */
export async function removeFromTwinGroup(memberId: string): Promise<void> {
  await membersApi.update(memberId, {
    is_twin: false,
    twin_group_id: null,
  });
}
