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
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background/50 to-primary/5">
      {/* Floating Header with back button */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-primary/10">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-primary/10 hover-scale">
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              ملف شخصي مفصل
            </h2>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Hero Profile Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10 border border-primary/20 shadow-lg animate-fade-in">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-xl"></div>
          
          <CardContent className="relative p-6">
            <div className="flex flex-col items-center gap-6">
              {/* Enhanced Avatar Section */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full p-1 animate-pulse">
                  <div className="bg-background rounded-full p-1">
                    <Avatar className="h-28 w-28 ring-4 ring-primary/20 transition-transform group-hover:scale-105">
                      <AvatarImage src={member.image} className="object-cover" />
                      <AvatarFallback className={`${getGenderColor(member.gender)} text-white text-2xl font-bold`}>
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                {/* Floating Gender Badge */}
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                  <Badge 
                    className={`${
                      member.gender === 'male' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                        : 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700'
                    } text-white shadow-lg animate-scale-in border-0`}
                  >
                    {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                  </Badge>
                </div>
              </div>
              
              {/* Enhanced Name and Bio Section */}
              <div className="text-center space-y-4 max-w-full">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {member.name}
                </h3>
                {member.bio && (
                  <div className="relative">
                    <p className="text-muted-foreground italic text-sm leading-relaxed px-4 py-2 bg-muted/30 rounded-lg border border-muted">
                      "{member.bio}"
                    </p>
                  </div>
                )}
                
                {/* Enhanced Info Badges */}
                <div className="flex flex-wrap justify-center gap-3">
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-colors"
                  >
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {member.birth_date ? new Date(member.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </span>
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:border-red-300 transition-colors"
                  >
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-700">
                      {getMaritalStatus()}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex gap-3 w-full mt-4">
                <Button 
                  onClick={onEdit} 
                  className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
                  size="sm"
                >
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل البيانات
                </Button>
                <Button 
                  onClick={onDelete} 
                  variant="destructive" 
                  className="flex-1 bg-gradient-to-r from-destructive to-destructive/90 hover:from-destructive/90 hover:to-destructive shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف العضو
                </Button>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Enhanced Family Information Cards */}
        <div className="space-y-6">
          {/* Parents Section */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 border border-primary/15 shadow-md animate-fade-in">
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-lg"></div>
            <CardContent className="relative p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  الوالدين
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border border-blue-200/50">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-blue-700">الوالد</span>
                    <p className="text-sm text-foreground font-semibold">{father?.name || 'غير محدد'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-pink-100/50 rounded-lg border border-pink-200/50">
                  <div className="p-2 rounded-full bg-pink-500/10">
                    <User className="h-4 w-4 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-pink-700">الوالدة</span>
                    <p className="text-sm text-foreground font-semibold">{mother?.name || 'غير محدد'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Additional Info Section */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50 border border-primary/15 shadow-md animate-fade-in">
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-emerald-500/10 to-transparent rounded-full blur-lg"></div>
            <CardContent className="relative p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  معلومات إضافية
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200/50">
                  <div className="p-2 rounded-full bg-emerald-500/10">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-emerald-700">مكان الميلاد</span>
                    <p className="text-sm text-foreground font-semibold">{member.birth_place || 'غير محدد'}</p>
                  </div>
                </div>
                
                {member.death_date && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-red-100/50 rounded-lg border border-red-200/50">
                    <div className="p-2 rounded-full bg-red-500/10">
                      <Calendar className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-red-700">تاريخ الوفاة</span>
                      <p className="text-sm text-foreground font-semibold">{new Date(member.death_date).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          {/* Spouses Section */}
          {spouses.length > 0 && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-50/50 via-pink-50/30 to-red-50/50 border border-primary/15 shadow-md animate-fade-in">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent rounded-full blur-xl"></div>
              <CardContent className="relative p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/10 to-pink-500/10">
                    <Heart className="h-5 w-5 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                    الأزواج ({spouses.length})
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {spouses.map((spouse, index) => (
                    <div key={spouse.id} className="group relative p-4 bg-gradient-to-r from-white/80 to-rose-50/80 rounded-lg border border-rose-200/50 hover:border-rose-300/70 transition-all duration-300 hover-scale">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-rose-200/50 group-hover:ring-rose-300/70 transition-all">
                            <AvatarImage src={spouse.image} className="object-cover" />
                            <AvatarFallback className={`${getGenderColor(spouse.gender)} text-white font-bold`}>
                              {spouse.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Heart className="h-2 w-2 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-bold text-foreground">{spouse.name}</p>
                          {spouse.marriage_date && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              تاريخ الزواج: {new Date(spouse.marriage_date).toLocaleDateString('ar-SA')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          )}

          {/* Children Section */}
          {children.length > 0 && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/50 border border-primary/15 shadow-md animate-fade-in">
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full blur-xl"></div>
              <CardContent className="relative p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    الأطفال ({children.length})
                  </h3>
                </div>
                
                {spouses.length > 0 ? (
                  <div className="space-y-6">
                    {spouses.map((spouse, spouseIndex) => {
                      const spouseChildren = getChildrenBySpouse(spouse.id);
                      if (spouseChildren.length === 0) return null;
                      
                      return (
                        <div key={spouse.id} className="space-y-3">
                          <div className="flex items-center gap-2 pb-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                            <h4 className="font-bold text-green-700 text-sm">
                              الأطفال من {spouse.name} ({spouseChildren.length})
                            </h4>
                          </div>
                          
                          <div className="grid gap-2 pl-4">
                            {spouseChildren.map((child, childIndex) => (
                              <div key={child.id} className="group flex items-center gap-3 p-3 bg-gradient-to-r from-white/80 to-green-50/80 rounded-lg border border-green-200/50 hover:border-green-300/70 transition-all duration-300 hover-scale">
                                <Avatar className="h-10 w-10 ring-2 ring-green-200/50 group-hover:ring-green-300/70 transition-all">
                                  <AvatarImage src={child.image} className="object-cover" />
                                  <AvatarFallback className={`${getGenderColor(child.gender)} text-white font-bold text-sm`}>
                                    {child.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1">
                                  <p className="font-semibold text-foreground text-sm">{child.name}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {child.birth_date ? new Date(child.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {spouseIndex < spouses.length - 1 && spouses[spouseIndex + 1] && getChildrenBySpouse(spouses[spouseIndex + 1].id).length > 0 && (
                            <Separator className="my-4 bg-gradient-to-r from-transparent via-green-300/50 to-transparent" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {children.map((child) => (
                      <div key={child.id} className="group flex items-center gap-3 p-3 bg-gradient-to-r from-white/80 to-green-50/80 rounded-lg border border-green-200/50 hover:border-green-300/70 transition-all duration-300 hover-scale">
                        <Avatar className="h-10 w-10 ring-2 ring-green-200/50 group-hover:ring-green-300/70 transition-all">
                          <AvatarImage src={child.image} className="object-cover" />
                          <AvatarFallback className={`${getGenderColor(child.gender)} text-white font-bold text-sm`}>
                            {child.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">{child.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {child.birth_date ? new Date(child.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};