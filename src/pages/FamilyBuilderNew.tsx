
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import EditModal from '@/components/EditModal';
import MemberCard from '@/components/MemberCard';
import AddMemberModal from '@/components/AddMemberModal';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GlobalFooterSimplified } from '@/components/GlobalFooterSimplified';
import Loading from '@/components/Loading';

interface FamilyMember {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  gender: string;
  birth_date: string;
  death_date: string;
  is_alive: boolean;
  biography: string;
  image_url: string;
  marital_status: string;
  family_id: string;
  father_id: string;
  mother_id: string;
  spouse_id: string;
  is_founder: boolean;
  created_by: string;
  related_person_id: string;
  created_at: string;
  updated_at: string;
  relationship: string;
  additional_info: string;
  order: number;
}

const FamilyBuilderNew: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      fetchFamilyMembers();
    }
  }, [user]);

  const fetchFamilyMembers = async () => {
    try {
      if (!user?.id) return;

      const { data: families, error: familyError } = await supabase
        .from('families')
        .select('id')
        .eq('creator_id', user.id)
        .limit(1);

      if (familyError || !families || families.length === 0) {
        console.log('No family found, creating new one...');
        const { data: newFamily, error: createError } = await supabase
          .from('families')
          .insert({
            name: `${user.email}'s Family`,
            creator_id: user.id,
            description: 'Family tree created automatically'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating family:', createError);
          return;
        }

        setFamilyId(newFamily.id);
      } else {
        setFamilyId(families[0].id);
      }

      const { data: familyMembers, error: membersError } = await supabase
        .from('family_tree_members')
        .select('*')
        .eq('family_id', families ? families[0].id : familyId)
        .order('created_at', { ascending: true });

      if (membersError) {
        console.error('Error fetching family members:', membersError);
        return;
      }

      // Transform the data to match our FamilyMember interface
      const transformedMembers: FamilyMember[] = (familyMembers || []).map((member, index) => ({
        ...member,
        relationship: '',
        additional_info: member.biography || '',
        order: index
      }));

      setMembers(transformedMembers);
    } catch (error) {
      console.error('Error in fetchFamilyMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async (memberData: Partial<FamilyMember>, imageFile?: File) => {
    try {
      let imageUrl = memberData.image_url || '';
      
      // Only handle image upload/deletion if a new file is selected
      if (imageFile) {
        // Delete old image if it exists
        if (memberData.image_url) {
          const oldFileName = memberData.image_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage
              .from('family-photos')
              .remove([oldFileName]);
          }
        }

        // Upload new image
        const fileName = `${uuidv4()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('family-photos')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('family-photos')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const memberToSave = {
        ...memberData,
        image_url: imageUrl,
        family_id: familyId,
        created_by: user?.id,
        name: `${memberData.first_name || ''} ${memberData.last_name || ''}`.trim()
      };

      if (memberData.id) {
        // Update existing member
        const { error } = await supabase
          .from('family_tree_members')
          .update(memberToSave)
          .eq('id', memberData.id);

        if (error) {
          console.error('Error updating member:', error);
          toast.error('Failed to update member');
          return;
        }

        // Update local state
        setMembers(prev => prev.map(member => 
          member.id === memberData.id 
            ? { ...member, ...memberToSave }
            : member
        ));

        toast.success('Member updated successfully');
      } else {
        // Create new member
        const { data: newMember, error } = await supabase
          .from('family_tree_members')
          .insert(memberToSave)
          .select()
          .single();

        if (error) {
          console.error('Error creating member:', error);
          toast.error('Failed to create member');
          return;
        }

        const transformedMember: FamilyMember = {
          ...newMember,
          relationship: '',
          additional_info: newMember.biography || '',
          order: members.length
        };

        setMembers(prev => [...prev, transformedMember]);
        toast.success('Member added successfully');
      }

      setIsEditModalOpen(false);
      setIsAddModalOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Error in handleSaveMember:', error);
      toast.error('An error occurred while saving member');
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('family_tree_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting member:', error);
        toast.error('Failed to delete member');
        return;
      }

      setMembers(prev => prev.filter(member => member.id !== id));
      toast.success('Member deleted successfully');
    } catch (error) {
      console.error('Error in handleDeleteMember:', error);
      toast.error('An error occurred while deleting member');
    }
  };

  const handleEditMember = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleAddMember = () => {
    setSelectedMember(null);
    setIsAddModalOpen(true);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(members);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setMembers(updatedItems);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Family Builder</h1>
              <p className="text-gray-600">Build and manage your family tree</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddMember}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add Member
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="family-members">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {members.map((member, index) => (
                  <Draggable key={member.id} draggableId={member.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <MemberCard
                          member={member}
                          onEdit={handleEditMember}
                          onDelete={handleDeleteMember}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {members.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No family members yet</div>
            <button
              onClick={handleAddMember}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Add Your First Family Member
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {isEditModalOpen && selectedMember && (
        <EditModal
          member={selectedMember}
          onSave={handleSaveMember}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedMember(null);
          }}
        />
      )}

      {isAddModalOpen && (
        <AddMemberModal
          onSave={handleSaveMember}
          onCancel={() => setIsAddModalOpen(false)}
          familyMembers={members}
        />
      )}

      <GlobalFooterSimplified />
    </div>
  );
};

export default FamilyBuilderNew;
