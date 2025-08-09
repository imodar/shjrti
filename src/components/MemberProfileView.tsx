import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, Heart, Users, Calendar, User, MapPin, ArrowRight } from 'lucide-react';

interface MemberProfileViewProps {
  member: any;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  familyMembers: any[];
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  member,
  onEdit,
  onDelete,
  onBack,
  familyMembers
}) => {
  if (!member) return null;

  const getGenderColor = (gender: string) => {
    return gender === 'male' ? 'bg-blue-500' : 'bg-pink-500';
  };

  const getMaritalStatus = () => {
    const spouses = familyMembers.filter(m => 
      m.spouse_ids?.includes(member.id) || member.spouse_ids?.includes(m.id)
    );
    return spouses.length > 0 ? 'متزوج' : 'أعزب';
  };

  const getSpouses = () => {
    return familyMembers.filter(m => 
      m.spouse_ids?.includes(member.id) || member.spouse_ids?.includes(m.id)
    );
  };

  const getChildren = () => {
    return familyMembers.filter(m => m.parent_id === member.id);
  };

  const getChildrenBySpouse = (spouseId?: string) => {
    const children = getChildren();
    if (!spouseId) return children.filter(child => !child.mother_id && !child.father_id);
    
    return children.filter(child => 
      child.mother_id === spouseId || child.father_id === spouseId
    );
  };

  const getFather = () => {
    if (member.gender === 'male') {
      return familyMembers.find(m => m.id === member.parent_id);
    } else {
      return familyMembers.find(m => m.id === member.father_id);
    }
  };

  const getMother = () => {
    if (member.gender === 'female') {
      return familyMembers.find(m => m.id === member.parent_id);
    } else {
      return familyMembers.find(m => m.id === member.mother_id);
    }
  };

  const father = getFather();
  const mother = getMother();
  const spouses = getSpouses();
  const children = getChildren();

  return (
    <div className="h-full overflow-y-auto">
      {/* Header with back button */}
      <div className="flex items-center gap-2 p-4 border-b">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          ملف شخصي مفصل
        </h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Header Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarImage src={member.image} />
                  <AvatarFallback className={`${getGenderColor(member.gender)} text-white text-xl`}>
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Badge 
                  className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${
                    member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                  }`}
                >
                  {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                </Badge>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">{member.name}</h3>
                {member.bio && (
                  <p className="text-muted-foreground italic text-sm">{member.bio}</p>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {member.birth_date ? new Date(member.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Heart className="h-3 w-3" />
                    {getMaritalStatus()}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full">
                <Button onClick={onEdit} className="flex-1" size="sm">
                  <Edit className="h-4 w-4 ml-1" />
                  تعديل
                </Button>
                <Button onClick={onDelete} variant="destructive" className="flex-1" size="sm">
                  <Trash2 className="h-4 w-4 ml-1" />
                  حذف
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Family Information */}
        <div className="space-y-4">
          {/* Parents */}
          <Card>
            <CardContent className="p-3">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                الوالدين
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3 w-3 text-blue-500" />
                  <span className="font-medium">الوالد:</span>
                  <span>{father?.name || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3 w-3 text-pink-500" />
                  <span className="font-medium">الوالدة:</span>
                  <span>{mother?.name || 'غير محدد'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card>
            <CardContent className="p-3">
              <h3 className="text-sm font-semibold mb-3">معلومات إضافية</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3" />
                  <span className="font-medium">مكان الميلاد:</span>
                  <span>{member.birth_place || 'غير محدد'}</span>
                </div>
                {member.death_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-red-500" />
                    <span className="font-medium">تاريخ الوفاة:</span>
                    <span>{new Date(member.death_date).toLocaleDateString('ar-SA')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spouses */}
          {spouses.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  الأزواج ({spouses.length})
                </h3>
                <div className="space-y-2">
                  {spouses.map((spouse) => (
                    <div key={spouse.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={spouse.image} />
                        <AvatarFallback className={getGenderColor(spouse.gender)}>
                          {spouse.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{spouse.name}</p>
                        {spouse.marriage_date && (
                          <p className="text-xs text-muted-foreground">
                            تاريخ الزواج: {new Date(spouse.marriage_date).toLocaleDateString('ar-SA')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Children */}
          {children.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  الأطفال ({children.length})
                </h3>
                
                {spouses.length > 0 ? (
                  <div className="space-y-4">
                    {spouses.map((spouse) => {
                      const spouseChildren = getChildrenBySpouse(spouse.id);
                      if (spouseChildren.length === 0) return null;
                      
                      return (
                        <div key={spouse.id}>
                          <h4 className="font-medium mb-2 text-primary text-xs">
                            الأطفال من {spouse.name} ({spouseChildren.length})
                          </h4>
                          <div className="space-y-2">
                            {spouseChildren.map((child) => (
                              <div key={child.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={child.image} />
                                  <AvatarFallback className={getGenderColor(child.gender)}>
                                    {child.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-xs">{child.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {child.birth_date ? new Date(child.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {spouses.indexOf(spouse) < spouses.length - 1 && <Separator className="mt-2" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={child.image} />
                          <AvatarFallback className={getGenderColor(child.gender)}>
                            {child.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-xs">{child.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {child.birth_date ? new Date(child.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};