
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

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

interface MemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onEdit, onDelete }) => {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {member.image_url && (
          <img
            src={member.image_url}
            alt={member.name}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <h3 className="text-lg font-semibold">{member.name || `${member.first_name} ${member.last_name}`}</h3>
        <p className="text-muted-foreground">{member.gender}</p>
        <p className="text-sm text-muted-foreground">
          Born: {member.birth_date}
        </p>
        {!member.is_alive && member.death_date && (
          <p className="text-sm text-muted-foreground">
            Died: {member.death_date}
          </p>
        )}
        {member.biography && (
          <p className="text-sm mt-2 line-clamp-3">{member.biography}</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(member)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(member.id)}
          className="flex items-center gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MemberCard;
