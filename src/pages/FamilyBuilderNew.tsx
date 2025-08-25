import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import EditModal from '@/components/EditModal';
import MemberCard from '@/components/MemberCard';
import AddMemberModal from '@/components/AddMemberModal';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loading from '@/components/Loading';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  image_url: string;
  family_id: string;
  created_at: string;
  updated_at: string;
  is_alive: boolean;
  birth_date: string;
  death_date: string;
  additional_info: string;
  order: number;
}

const FamilyBuilderNew = () => {
  const [familyTree, setFamilyTree] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { auth } = useAuth();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const router = useRouter();
  const [isDeleteAlertDialogOpen, setIsDeleteAlertDialogOpen] = useState(false);

  useEffect(() => {
    const fetchFamilies = async () => {
      if (!auth.user) {
        console.error('❌ User not authenticated');
        return;
      }

      try {
        setIsLoading(true);
        const { data: families, error } = await supabase
          .from('families')
          .select('*')
          .eq('user_id', auth.user.id);

        if (error) {
          console.error('❌ Error fetching families:', error);
          toast.error('Error fetching families');
          return;
        }

        if (families && families.length > 0) {
          setSelectedFamily(families[0].id);
        } else {
          // If no families exist, create a new one
          const newFamilyId = uuidv4();
          const { error: createError } = await supabase
            .from('families')
            .insert([{ id: newFamilyId, user_id: auth.user.id, name: 'My Family' }]);

          if (createError) {
            console.error('❌ Error creating family:', createError);
            toast.error('Error creating family');
            return;
          }

          setSelectedFamily(newFamilyId);
          toast.success('New family created!');
        }
      } catch (error) {
        console.error('❌ Error fetching or creating family:', error);
        toast.error('Error fetching or creating family');
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.user) {
      fetchFamilies();
    }
  }, [auth.user]);

  useEffect(() => {
    if (selectedFamily) {
      fetchFamilyTree();
    }
  }, [selectedFamily]);

  const fetchFamilyTree = async () => {
    if (!selectedFamily) {
      console.warn('⚠️ No family selected');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', selectedFamily)
        .order('order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching family tree:', error);
        toast.error('Error fetching family tree');
        return;
      }

      setFamilyTree(data || []);
    } catch (error) {
      console.error('❌ Error fetching family tree:', error);
      toast.error('Error fetching family tree');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedImage(file || null);
  };

  const openEditModal = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedMember(null);
    setIsEditModalOpen(false);
    setSelectedImage(null);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleCreateMember = async (newMember: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>) => {
    if (!selectedFamily || !auth.user) {
      console.error('❌ No family selected or user not authenticated');
      return;
    }

    try {
      setIsLoading(true);

      let imageUrl = '';

      if (selectedImage && selectedImage instanceof File) {
        console.log('📸 Uploading new image...');

        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${auth.user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('family-images')
          .upload(fileName, selectedImage);

        if (uploadError) {
          console.error('❌ Image upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('family-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        console.log('✅ Image uploaded successfully:', publicUrl);
      } else {
        imageUrl = '/placeholder.svg';
      }

      const newMemberData = {
        ...newMember,
        id: uuidv4(),
        family_id: selectedFamily,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order: familyTree.length,
      };

      const { error } = await supabase
        .from('family_tree_members')
        .insert([newMemberData]);

      if (error) {
        console.error('❌ Error creating member:', error);
        throw error;
      }

      console.log('✅ Member created successfully');
      setSelectedImage(null);
      await fetchFamilyTree();
      closeAddModal();
    } catch (error) {
      console.error('❌ Error in handleCreateMember:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMember = async (updatedMember: any) => {
    if (!selectedFamily || !auth.user) {
      console.error('❌ No family selected or user not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      
      // Preserve existing image_url if no new image is selected
      let imageUrl = updatedMember.image_url;
      
      // Only update image if a new file was selected
      if (selectedImage && selectedImage instanceof File) {
        console.log('📸 Uploading new image...');
        
        // Delete old image if it exists and it's not the default placeholder
        if (updatedMember.image_url && !updatedMember.image_url.includes('placeholder.svg')) {
          try {
            const oldImagePath = updatedMember.image_url.split('/').pop();
            if (oldImagePath) {
              await supabase.storage
                .from('family-images')
                .remove([oldImagePath]);
            }
          } catch (error) {
            console.warn('⚠️ Could not delete old image:', error);
          }
        }

        // Upload new image
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${auth.user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('family-images')
          .upload(fileName, selectedImage);

        if (uploadError) {
          console.error('❌ Image upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('family-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        console.log('✅ Image uploaded successfully:', publicUrl);
      }

      // Update member data with preserved or new image URL
      const memberData = {
        ...updatedMember,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('family_tree_members')
        .update(memberData)
        .eq('id', updatedMember.id);

      if (error) {
        console.error('❌ Error updating member:', error);
        throw error;
      }

      console.log('✅ Member updated successfully');
      
      // Reset selected image after successful save
      setSelectedImage(null);
      
      // Refresh the family tree data
      await fetchFamilyTree();
      
      // Close the modal
      setSelectedMember(null);
      setIsEditModalOpen(false);

    } catch (error) {
      console.error('❌ Error in handleSaveMember:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) {
      console.error('❌ No member selected');
      return;
    }

    try {
      setIsLoading(true);

      // Delete the image from storage if it exists and it's not the default placeholder
      if (selectedMember.image_url && !selectedMember.image_url.includes('placeholder.svg')) {
        try {
          const oldImagePath = selectedMember.image_url.split('/').pop();
          if (oldImagePath) {
            await supabase.storage
              .from('family-images')
              .remove([oldImagePath]);
          }
        } catch (error) {
          console.warn('⚠️ Could not delete old image:', error);
        }
      }

      const { error } = await supabase
        .from('family_tree_members')
        .delete()
        .eq('id', selectedMember.id);

      if (error) {
        console.error('❌ Error deleting member:', error);
        toast.error('Error deleting member');
        return;
      }

      console.log('✅ Member deleted successfully');
      await fetchFamilyTree();
      closeEditModal();
      setIsDeleteAlertDialogOpen(false);
    } catch (error) {
      console.error('❌ Error in handleDeleteMember:', error);
      toast.error('Error deleting member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(familyTree);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order property of each item in the array
    const updatedItems = items.map((item, index) => ({ ...item, order: index }));

    setFamilyTree(updatedItems);

    // Update the order in the database
    try {
      setIsLoading(true);
      const updates = updatedItems.map(member => ({ id: member.id, order: member.order }));

      // Use a single update operation to update all members
      const { error } = await supabase
        .from('family_tree_members')
        .upsert(updates);

      if (error) {
        console.error('❌ Error updating member orders:', error);
        toast.error('Error updating member orders');
        // Revert to the original order in case of error
        await fetchFamilyTree();
        return;
      }

      console.log('✅ Member orders updated successfully');
    } catch (error) {
      console.error('❌ Error updating member orders:', error);
      toast.error('Error updating member orders');
      // Revert to the original order in case of error
      await fetchFamilyTree();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Family Tree Builder</h1>

        <div className="flex justify-end mb-4">
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={openAddModal}
          >
            Add Member
          </button>
        </div>

        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="familyTree">
            {(provided) => (
              <ul className="family-tree-list" {...provided.droppableProps} ref={provided.innerRef}>
                {familyTree.map((member, index) => (
                  <Draggable key={member.id} draggableId={member.id} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="mb-4"
                      >
                        <MemberCard member={member} onEdit={() => openEditModal(member)} />
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>

        <EditModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          member={selectedMember}
          onSave={handleSaveMember}
          onImageChange={handleImageChange}
          selectedImage={selectedImage}
          onDelete={() => setIsDeleteAlertDialogOpen(true)}
        />

        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          onCreate={handleCreateMember}
          onImageChange={handleImageChange}
          selectedImage={selectedImage}
        />
        <AlertDialog open={isDeleteAlertDialogOpen} onOpenChange={setIsDeleteAlertDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the member from your family tree.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteAlertDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMember}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default FamilyBuilderNew;
