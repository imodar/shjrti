import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MemberProfileView } from '@/components/MemberProfileView';
import MemberProfileSkeleton from '@/components/skeletons/MemberProfileSkeleton';
import { useMemberData } from '@/hooks/useMemberData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
  familyId: string | null;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMemberClick?: (member: any) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  onClose,
  memberId,
  familyId,
  readOnly = false,
  onEdit,
  onDelete,
  onMemberClick
}) => {
  const { data, loading, error } = useMemberData(memberId, familyId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading && <MemberProfileSkeleton />}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!loading && !error && data.member && (
          <MemberProfileView
            member={data.member}
            familyMembers={data.familyMembers}
            marriages={data.marriages}
            readOnly={readOnly}
            onEdit={onEdit}
            onDelete={onDelete}
            onMemberClick={onMemberClick}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
