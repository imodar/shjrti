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
  console.log('MemberProfileView - member data:', member);
  console.log('MemberProfileView - familyMembers data:', familyMembers);
  if (!member) return null;
  const getGenderColor = (gender: string) => {
    return gender === 'male' ? 'bg-blue-500' : 'bg-pink-500';
  };
  const getMaritalStatus = (spouse?: any) => {
    if (spouse && spouse.marital_status === 'divorced') {
      return 'مطلق';
    }
    const spouses = getSpouses();
    return spouses.length > 0 ? 'متزوج' : 'أعزب';
  };
  const getSpouses = () => {
    // First check marriages table for proper relationships
    const marriages = familyMembers.filter(m => member.gender === 'male' && m.husband_id === member.id || member.gender === 'female' && m.wife_id === member.id);
    if (marriages.length > 0) {
      return marriages.map(marriage => {
        const spouseId = member.gender === 'male' ? marriage.wife_id : marriage.husband_id;
        const spouse = familyMembers.find(m => m.id === spouseId);
        return spouse ? {
          ...spouse,
          marital_status: marriage.marital_status,
          marriage_date: marriage.created_at
        } : null;
      }).filter(Boolean);
    }

    // Fallback to direct spouse_id relationship
    return familyMembers.filter(m => member.spouse_id === m.id || m.spouse_id === member.id);
  };
  const getChildren = () => {
    return familyMembers.filter(m => m.father_id === member.id || m.mother_id === member.id);
  };
  
  const getChildrenBySpouse = (spouseId?: string) => {
    const children = getChildren();
    if (!spouseId) return children.filter(child => (!child.mother_id && !child.father_id) || (child.father_id === member.id && !child.mother_id) || (child.mother_id === member.id && !child.father_id));
    
    if (member.gender === 'male') {
      return children.filter(child => child.mother_id === spouseId && child.father_id === member.id);
    } else {
      return children.filter(child => child.father_id === spouseId && child.mother_id === member.id);
    }
  };
  
  const getFather = () => {
    return familyMembers.find(m => m.id === member.father_id);
  };
  
  const getMother = () => {
    return familyMembers.find(m => m.id === member.mother_id);
  };
  const father = getFather();
  const mother = getMother();
  const spouses = getSpouses();
  const children = getChildren();
  
  console.log('Profile data debug:', {
    member: member.name,
    birth_date: member.birth_date,
    father: father?.name,
    mother: mother?.name,
    spouses: spouses.map(s => s.name),
    children: children.map(c => c.name)
  });
  return <div className="h-full overflow-y-auto bg-gradient-to-br from-violet-50/30 via-blue-50/20 to-emerald-50/30 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-gradient-to-tr from-accent/15 to-primary/15 rounded-full blur-2xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-full blur-xl animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
      </div>

      {/* Glassmorphism Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
        
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Hero Profile Card - Completely Redesigned */}
        <div className="relative group">
          {/* Main Card with Glassmorphism */}
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 border border-white/30 shadow-2xl">
            {/* Animated Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            {/* Content */}
            <div className="relative p-8 text-center">
                {/* Avatar Section with Advanced Design */}
                <div className="relative inline-block mb-6">
                  {/* Gradient Ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 p-1">
                    <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Avatar className="w-24 h-24 ring-4 ring-white/30">
                        <AvatarImage src={member.image_url} className="object-cover" />
                        <AvatarFallback className={`text-2xl font-bold text-white ${getGenderColor(member.gender)}`}>
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                
                {/* Floating Status Indicators */}
                <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                  <div className={`w-6 h-6 rounded-full ${member.gender === 'male' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-pink-500 to-pink-600'} flex items-center justify-center shadow-lg animate-bounce`}>
                    <User className="h-3 w-3 text-white" />
                  </div>
                  {getMaritalStatus() === 'متزوج' && <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center shadow-lg animate-bounce" style={{
                  animationDelay: '0.5s'
                }}>
                      <Heart className="h-3 w-3 text-white" />
                    </div>}
                </div>
              </div>

              {/* Name and Bio Section */}
              <div className="space-y-4 mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                  {member.name}
                </h1>
                
                {member.biography && <div className="relative max-w-md mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-200/30 to-emerald-200/30 rounded-2xl blur-sm"></div>
                    <p className="relative text-gray-600 italic font-medium px-6 py-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40">
                      "{member.biography}"
                    </p>
                  </div>}
                
                {/* Enhanced Info Pills */}
                <div className="flex flex-wrap justify-center gap-3">
                  <div className="group relative overflow-hidden rounded-full backdrop-blur-sm bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-300/30 px-4 py-2 hover:scale-105 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        {member.birth_date ? new Date(member.birth_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="group relative overflow-hidden rounded-full backdrop-blur-sm bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-300/30 px-4 py-2 hover:scale-105 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <Badge className={`h-4 w-4 rounded-full ${member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`} />
                      <span className="text-sm font-semibold text-gray-700">
                        {member.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="group relative overflow-hidden rounded-full backdrop-blur-sm bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-300/30 px-4 py-2 hover:scale-105 transition-transform">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        {getMaritalStatus()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Family Information Cards - Masonry Layout */}
        <div className="grid grid-cols-1 gap-6">
          {/* Parents Section */}
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl border border-blue-300/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative p-6">
              {/* Section Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-30"></div>
                  <div className="relative p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-sm">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  الوالدين
                </h3>
              </div>
              
              {/* Parents Grid */}
              <div className="space-y-4">
                <div className="group/item relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/40 p-4 hover:border-blue-300/60 transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-700 mb-1">الوالد</p>
                      <p className="text-base font-bold text-gray-800">{father?.name || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="group/item relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-50/80 to-rose-50/80 border border-pink-200/40 p-4 hover:border-pink-300/60 transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-pink-700 mb-1">الوالدة</p>
                      <p className="text-base font-bold text-gray-800">{mother?.name || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl border border-emerald-300/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-sm opacity-30"></div>
                  <div className="relative p-3 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl backdrop-blur-sm">
                    <MapPin className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  معلومات إضافية
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/40 p-4 hover:border-emerald-300/60 transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-700 mb-1">مكان الميلاد</p>
                      <p className="text-base font-bold text-gray-800">{member.birth_place || 'غير محدد'}</p>
                    </div>
                  </div>
                </div>
                
                {member.death_date && <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-50/80 to-orange-50/80 border border-red-200/40 p-4 hover:border-red-300/60 transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-700 mb-1">تاريخ الوفاة</p>
                        <p className="text-base font-bold text-gray-800">{new Date(member.death_date).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  </div>}
              </div>
            </div>
          </div>

          {/* Spouses Section */}
          {spouses.length > 0 && <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl border border-rose-300/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-500 rounded-2xl blur-sm opacity-30"></div>
                    <div className="relative p-3 bg-gradient-to-br from-rose-500/20 to-red-500/20 rounded-2xl backdrop-blur-sm">
                      <Heart className="h-6 w-6 text-rose-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
                    الأزواج ({spouses.length})
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {spouses.map((spouse, index) => <div key={spouse.id} className="group/spouse relative overflow-hidden rounded-xl bg-gradient-to-r from-white/90 to-rose-50/90 border border-rose-200/50 p-5 hover:border-rose-300/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full p-0.5">
                            <div className="rounded-full bg-white p-0.5">
                 <Avatar className="h-14 w-14 ring-2 ring-rose-200/50 group-hover/spouse:ring-rose-300/70 transition-all">
                                 <AvatarImage src={spouse.image_url} className="object-cover" />
                                 <AvatarFallback className={`${getGenderColor(spouse.gender)} text-white font-bold`}>
                                   {spouse.name.charAt(0)}
                                 </AvatarFallback>
                               </Avatar>
                            </div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                            <Heart className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-lg font-bold text-gray-800">{spouse.name}</p>
                            {spouse.marital_status === 'divorced' && <Badge variant="destructive" className="text-xs">مطلق</Badge>}
                          </div>
                          {spouse.marriage_date && <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-rose-500" />
                              <span>تاريخ الزواج: {new Date(spouse.marriage_date).toLocaleDateString('ar-SA')}</span>
                            </div>}
                          
                          {/* Show children for this spouse */}
                          {(() => {
                      const spouseChildren = getChildrenBySpouse(spouse.id);
                      if (spouseChildren.length > 0) {
                        return <div className="mt-3 pt-3 border-t border-rose-200/50">
                                  <p className="text-sm font-semibold text-rose-700 mb-2">الأطفال ({spouseChildren.length})</p>
                                  <div className="flex flex-wrap gap-2">
                                    {spouseChildren.map(child => <div key={child.id} className="flex items-center gap-2 bg-rose-50/80 rounded-lg px-3 py-1">
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={child.image_url} className="object-cover" />
                                          <AvatarFallback className={`${getGenderColor(child.gender)} text-white text-xs`}>
                                            {child.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-gray-700">{child.name}</span>
                                      </div>)}
                                  </div>
                                </div>;
                      }
                      return null;
                    })()}
                        </div>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>}

        </div>

        {/* Action Buttons at Bottom */}
        <div className="sticky bottom-0 backdrop-blur-xl bg-white/10 border-t border-white/20 p-6 mt-8">
          <div className="flex gap-4">
            <Button onClick={onEdit} className="flex-1 relative overflow-hidden bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group" size="lg">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Edit className="h-5 w-5 ml-2 relative z-10" />
              <span className="relative z-10">تعديل المعلومات</span>
            </Button>
            
            <Button onClick={onDelete} className="flex-1 relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group" size="lg">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Trash2 className="h-5 w-5 ml-2 relative z-10" />
              <span className="relative z-10">حذف العضو</span>
            </Button>
          </div>
        </div>
      </div>
    </div>;
};