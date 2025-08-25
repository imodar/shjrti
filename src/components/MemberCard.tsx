import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  gender?: string;
  image_url?: string;
  birth_date?: string;
  is_alive?: boolean;
  biography?: string;
}

interface MemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onEdit }) => {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <img
            src={member.image_url || '/placeholder.svg'}
            alt={member.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{member.name}</h3>
            {member.birth_date && (
              <p className="text-sm text-muted-foreground">
                Born: {new Date(member.birth_date).toLocaleDateString()}
              </p>
            )}
            {member.biography && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {member.biography}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={() => onEdit(member)} variant="outline" size="sm">
          <Edit2 className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MemberCard;