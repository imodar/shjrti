import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, Heart, Users, Calendar, User, MapPin } from 'lucide-react';

interface MemberProfileViewProps {
  member: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  familyMembers: any[];
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  member,
  isOpen,
  onClose,
  onEdit,
  onDelete,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ملف شخصي مفصل
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src={member.image} />
                    <AvatarFallback className={`${getGenderColor(member.gender)} text-white text-2xl`}>
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
                
                <div className="flex-1 text-center md:text-right space-y-3">
                  <h2 className="text-3xl font-bold">{member.name}</h2>
                  {member.bio && (
                    <p className="text-muted-foreground italic">{member.bio}</p>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {member.birth_date ? new Date(member.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {getMaritalStatus()}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button onClick={onEdit} className="w-full">
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                  </Button>
                  <Button onClick={onDelete} variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Family Information */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Parents */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  الوالدين
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">الوالد:</span>
                    <span>{father?.name || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-pink-500" />
                    <span className="font-medium">الوالدة:</span>
                    <span>{mother?.name || 'غير محدد'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">معلومات إضافية</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">مكان الميلاد:</span>
                    <span>{member.birth_place || 'غير محدد'}</span>
                  </div>
                  {member.death_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className="font-medium">تاريخ الوفاة:</span>
                      <span>{new Date(member.death_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spouses */}
          {spouses.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  الأزواج ({spouses.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {spouses.map((spouse) => (
                    <div key={spouse.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={spouse.image} />
                        <AvatarFallback className={getGenderColor(spouse.gender)}>
                          {spouse.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{spouse.name}</p>
                        {spouse.marriage_date && (
                          <p className="text-sm text-muted-foreground">
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
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  الأطفال ({children.length})
                </h3>
                
                {spouses.length > 0 ? (
                  <div className="space-y-6">
                    {spouses.map((spouse) => {
                      const spouseChildren = getChildrenBySpouse(spouse.id);
                      if (spouseChildren.length === 0) return null;
                      
                      return (
                        <div key={spouse.id}>
                          <h4 className="font-medium mb-3 text-primary">
                            الأطفال من {spouse.name} ({spouseChildren.length})
                          </h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {spouseChildren.map((child) => (
                              <div key={child.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={child.image} />
                                  <AvatarFallback className={getGenderColor(child.gender)}>
                                    {child.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{child.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {child.birth_date ? new Date(child.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {spouses.indexOf(spouse) < spouses.length - 1 && <Separator className="mt-4" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={child.image} />
                          <AvatarFallback className={getGenderColor(child.gender)}>
                            {child.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{child.name}</p>
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
      </DialogContent>
    </Dialog>
  );
};