import React, { useState, useEffect } from 'react';
import { DateDisplay, LifespanDisplay } from '@/components/DateDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Edit, 
  Trash2, 
  Heart, 
  Users, 
  Calendar, 
  User, 
  MapPin, 
  ArrowRight,
  Star,
  Crown,
  Gift,
  Phone,
  Mail,
  Home,
  Briefcase,
  GraduationCap,
  Camera,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ChevronDown,
  Award,
  Clock,
  Eye,
  Sparkles
} from 'lucide-react';

interface MemberProfileViewProps {
  member: any;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  familyMembers: any[];
  marriages?: any[];
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  member,
  onEdit,
  onDelete,
  onBack,
  familyMembers,
  marriages = []
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAllInfo, setShowAllInfo] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!member) return null;

  const getGenderColor = (gender: string) => {
    return gender === 'male' ? 'bg-blue-500' : 'bg-pink-500';
  };

  const getMaritalStatus = (spouse?: any) => {
    if (spouse && spouse.marital_status === 'divorced') {
      return 'مطلق';
    }
    const spouses = getSpouses();
    const children = getChildren();
    
    if (children.length > 0) {
      return 'متزوج';
    }
    
    if (member.relatedPersonId && spouses.length === 0) {
      const relatedPerson = familyMembers.find(m => m.id === member.relatedPersonId);
      if (relatedPerson) {
        return 'متزوج';
      }
    }
    
    return spouses.length > 0 ? 'متزوج' : 'أعزب';
  };

  const getSpouses = () => {
    const memberMarriages = marriages.filter(m => 
      (member.gender === 'male' && m.husband_id === member.id) || 
      (member.gender === 'female' && m.wife_id === member.id)
    );
    
    if (memberMarriages.length > 0) {
      return memberMarriages.map(marriage => {
        const spouseId = member.gender === 'male' ? marriage.wife_id : marriage.husband_id;
        const spouse = familyMembers.find(m => m.id === spouseId);
        return spouse ? {
          ...spouse,
          marital_status: marriage.marital_status || 'married',
          marriage_date: marriage.created_at
        } : null;
      }).filter(Boolean);
    }

    if (member.relatedPersonId) {
      const relatedPerson = familyMembers.find(m => m.id === member.relatedPersonId);
      if (relatedPerson) {
        return [relatedPerson];
      }
    }

    return familyMembers.filter(m => member.spouseId === m.id || m.spouseId === member.id);
  };

  const getChildren = () => {
    return familyMembers.filter(m => m.fatherId === member.id || m.motherId === member.id);
  };
  
  const getChildrenBySpouse = (spouseId?: string) => {
    const children = getChildren();
    if (!spouseId) return children.filter(child => (!child.motherId && !child.fatherId) || (child.fatherId === member.id && !child.motherId) || (child.motherId === member.id && !child.fatherId));
    
    if (member.gender === 'male') {
      return children.filter(child => child.motherId === spouseId && child.fatherId === member.id);
    } else {
      return children.filter(child => child.fatherId === spouseId && child.motherId === member.id);
    }
  };
  
  const getFather = () => {
    return familyMembers.find(m => m.id === member.fatherId);
  };
  
  const getMother = () => {
    return familyMembers.find(m => m.id === member.motherId);
  };

  const father = getFather();
  const mother = getMother();
  const spouses = getSpouses();
  const children = getChildren();

  const tabItems = [
    { id: 'overview', label: 'نظرة عامة', icon: User },
    { id: 'family', label: 'العائلة', icon: Users },
    { id: 'timeline', label: 'الأحداث', icon: Clock },
    { id: 'media', label: 'الصور', icon: Camera }
  ];

  const getAge = () => {
    if (!member.birthDate) return null;
    const birth = new Date(member.birthDate);
    const death = member.deathDate ? new Date(member.deathDate) : new Date();
    const age = death.getFullYear() - birth.getFullYear();
    return age;
  };

  return (
    <div className={`h-full overflow-hidden facebook-layout transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Facebook-Style Header */}
      <div className="facebook-header-layout sticky top-0 z-50">
        <div className="facebook-flex-start gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="facebook-button-secondary"
          >
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة
          </Button>
          <div className="facebook-flex-start gap-3">
            <Avatar className="h-10 w-10 facebook-avatar-md border-2 border-primary">
              {member.image_url ? (
                <AvatarImage src={member.image_url} alt={member.name} />
              ) : (
                <AvatarFallback className={`${getGenderColor(member.gender)} text-white font-bold`}>
                  {member.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h2 className="facebook-text-heading text-lg">{member.name}</h2>
              <p className="facebook-text-caption">{getMaritalStatus()}</p>
            </div>
          </div>
        </div>
        
        <div className="facebook-flex-end gap-2">
          <Button size="sm" variant="outline" className="facebook-button-secondary">
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="facebook-button-secondary">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="facebook-button-secondary">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="facebook-main-content">
        <div className="facebook-container-fluid max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="relative mb-8">
            {/* Cover Photo */}
            <div className="relative h-80 bg-gradient-to-r from-primary via-secondary to-accent rounded-t-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-pattern opacity-20"></div>
              
              {/* Floating Elements */}
              <div className="absolute top-8 right-8 animate-float">
                <div className="facebook-card p-3 bg-white/10 backdrop-blur-md border border-white/20">
                  <Crown className="h-6 w-6 text-yellow-300" />
                </div>
              </div>
              <div className="absolute top-16 left-12 animate-float-delayed">
                <div className="facebook-card p-2 bg-white/10 backdrop-blur-md border border-white/20">
                  <Star className="h-5 w-5 text-yellow-300" />
                </div>
              </div>
              <div className="absolute bottom-16 right-16 animate-float-slow">
                <div className="facebook-card p-2 bg-white/10 backdrop-blur-md border border-white/20">
                  <Sparkles className="h-5 w-5 text-blue-300" />
                </div>
              </div>
            </div>

            {/* Profile Info Card */}
            <div className="relative -mt-20 mx-8">
              <div className="facebook-card p-8 backdrop-blur-xl bg-white/95">
                <div className="facebook-flex-between items-end">
                  <div className="facebook-flex-start gap-6">
                    {/* Profile Avatar */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-30 scale-110"></div>
                      <Avatar className="relative h-32 w-32 border-4 border-white shadow-2xl">
                        {member.image_url ? (
                          <AvatarImage src={member.image_url} alt={member.name} className="object-cover" />
                        ) : (
                          <AvatarFallback className={`text-4xl font-bold text-white ${getGenderColor(member.gender)}`}>
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {/* Status Indicator */}
                      <div className="absolute -bottom-1 -right-1 facebook-card p-2 bg-success border-4 border-white rounded-full">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div>
                        <h1 className="facebook-text-heading text-4xl mb-2">
                          {member.name}
                        </h1>
                        {member.bio && (
                          <p className="facebook-text-body text-lg italic text-muted-foreground max-w-md">
                            "{member.bio}"
                          </p>
                        )}
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="facebook-flex-start gap-6 pt-2">
                        <div className="text-center">
                          <div className="facebook-text-heading text-2xl text-primary">{children.length}</div>
                          <div className="facebook-text-caption">الأطفال</div>
                        </div>
                        <div className="text-center">
                          <div className="facebook-text-heading text-2xl text-secondary">{spouses.length}</div>
                          <div className="facebook-text-caption">الأزواج</div>
                        </div>
                        {getAge() && (
                          <div className="text-center">
                            <div className="facebook-text-heading text-2xl text-accent">{getAge()}</div>
                            <div className="facebook-text-caption">سنة</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="facebook-flex-end gap-3">
                    <Button 
                      onClick={onEdit} 
                      className="facebook-button-primary px-6 py-3"
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      تعديل الملف الشخصي
                    </Button>
                    <Button 
                      variant="outline" 
                      className="facebook-button-secondary px-4 py-3"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="facebook-card mb-6">
            <div className="facebook-flex-start">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`facebook-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <tab.icon className="h-5 w-5 ml-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="facebook-feed-layout">
            <div className="facebook-feed-main space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="facebook-post">
                    <div className="facebook-post-header">
                      <div className="facebook-flex-start gap-3">
                        <div className="facebook-card p-3 bg-primary/10">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="facebook-post-author">المعلومات الشخصية</h3>
                          <p className="facebook-post-time">البيانات الأساسية</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAllInfo(!showAllInfo)}
                        className="facebook-button-secondary"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${showAllInfo ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Essential Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="facebook-flex-start gap-3 p-4 bg-blue-50 rounded-xl">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="facebook-text-caption text-blue-700">تاريخ الميلاد</div>
                            <div className="facebook-text-body font-semibold">
                              {member.birthDate ? <DateDisplay date={member.birthDate} className="inline" /> : 'غير محدد'}
                            </div>
                          </div>
                        </div>

                        <div className="facebook-flex-start gap-3 p-4 bg-green-50 rounded-xl">
                          <MapPin className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="facebook-text-caption text-green-700">مكان الميلاد</div>
                            <div className="facebook-text-body font-semibold">{member.birthPlace || 'غير محدد'}</div>
                          </div>
                        </div>

                        <div className="facebook-flex-start gap-3 p-4 bg-purple-50 rounded-xl">
                          <Heart className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="facebook-text-caption text-purple-700">الحالة الاجتماعية</div>
                            <div className="facebook-text-body font-semibold">{getMaritalStatus()}</div>
                          </div>
                        </div>

                        <div className="facebook-flex-start gap-3 p-4 bg-orange-50 rounded-xl">
                          <Award className="h-5 w-5 text-orange-600" />
                          <div>
                            <div className="facebook-text-caption text-orange-700">النوع</div>
                            <div className="facebook-text-body font-semibold">{member.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Death Date - if applicable */}
                      {member.deathDate && (
                        <div className="facebook-flex-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                          <Calendar className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="facebook-text-caption text-red-700">تاريخ الوفاة</div>
                            <div className="facebook-text-body font-semibold">
                              <DateDisplay date={member.deathDate} className="inline" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Info - Expandable */}
                      {showAllInfo && (
                        <div className="space-y-4 border-t pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="facebook-flex-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <Phone className="h-5 w-5 text-gray-600" />
                              <div>
                                <div className="facebook-text-caption text-gray-700">رقم الهاتف</div>
                                <div className="facebook-text-body font-semibold">{member.phone || 'غير محدد'}</div>
                              </div>
                            </div>

                            <div className="facebook-flex-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <Mail className="h-5 w-5 text-gray-600" />
                              <div>
                                <div className="facebook-text-caption text-gray-700">البريد الإلكتروني</div>
                                <div className="facebook-text-body font-semibold">{member.email || 'غير محدد'}</div>
                              </div>
                            </div>

                            <div className="facebook-flex-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <Briefcase className="h-5 w-5 text-gray-600" />
                              <div>
                                <div className="facebook-text-caption text-gray-700">المهنة</div>
                                <div className="facebook-text-body font-semibold">{member.occupation || 'غير محدد'}</div>
                              </div>
                            </div>

                            <div className="facebook-flex-start gap-3 p-4 bg-gray-50 rounded-xl">
                              <GraduationCap className="h-5 w-5 text-gray-600" />
                              <div>
                                <div className="facebook-text-caption text-gray-700">التعليم</div>
                                <div className="facebook-text-body font-semibold">{member.education || 'غير محدد'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Family Tab */}
              {activeTab === 'family' && (
                <div className="space-y-6">
                  {/* Parents */}
                  {(father || mother) && (
                    <div className="facebook-post">
                      <div className="facebook-post-header">
                        <div className="facebook-flex-start gap-3">
                          <div className="facebook-card p-3 bg-blue-500/10">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="facebook-post-author">الوالدين</h3>
                            <p className="facebook-post-time">الأسرة المباشرة</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {father && (
                          <div className="facebook-flex-start gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <Avatar className="h-16 w-16 facebook-avatar-lg border-2 border-blue-200">
                              <AvatarImage src={father.image_url} />
                              <AvatarFallback className="bg-blue-500 text-white font-bold text-lg">
                                {father.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="facebook-text-caption text-blue-700 mb-1">الوالد</div>
                              <div className="facebook-text-body font-bold text-lg">{father.name}</div>
                              {father.birthDate && (
                                <div className="facebook-text-caption mt-1">
                                  <DateDisplay date={father.birthDate} />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {mother && (
                          <div className="facebook-flex-start gap-4 p-4 bg-pink-50/50 rounded-xl border border-pink-100">
                            <Avatar className="h-16 w-16 facebook-avatar-lg border-2 border-pink-200">
                              <AvatarImage src={mother.image_url} />
                              <AvatarFallback className="bg-pink-500 text-white font-bold text-lg">
                                {mother.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="facebook-text-caption text-pink-700 mb-1">الوالدة</div>
                              <div className="facebook-text-body font-bold text-lg">{mother.name}</div>
                              {mother.birthDate && (
                                <div className="facebook-text-caption mt-1">
                                  <DateDisplay date={mother.birthDate} />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Spouses */}
                  {spouses.length > 0 && (
                    <div className="facebook-post">
                      <div className="facebook-post-header">
                        <div className="facebook-flex-start gap-3">
                          <div className="facebook-card p-3 bg-rose-500/10">
                            <Heart className="h-6 w-6 text-rose-600" />
                          </div>
                          <div>
                            <h3 className="facebook-post-author">الأزواج ({spouses.length})</h3>
                            <p className="facebook-post-time">شركاء الحياة</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {spouses.map((spouse, index) => (
                          <div key={spouse.id} className="facebook-flex-start gap-4 p-6 bg-gradient-to-r from-rose-50/50 to-pink-50/50 rounded-xl border border-rose-100 hover:shadow-md transition-all">
                            <Avatar className="h-20 w-20 facebook-avatar-lg border-3 border-rose-200">
                              <AvatarImage src={spouse.image_url} />
                              <AvatarFallback className={`${getGenderColor(spouse.gender)} text-white font-bold text-xl`}>
                                {spouse.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="facebook-flex-between items-start mb-2">
                                <div>
                                  <div className="facebook-text-body font-bold text-xl">{spouse.name}</div>
                                  <div className="facebook-text-caption text-rose-700">
                                    {spouse.marital_status === 'divorced' ? 'مطلق' : 'الزوج/الزوجة'}
                                  </div>
                                </div>
                                {spouse.marital_status === 'divorced' && (
                                  <Badge variant="destructive" className="text-xs">مطلق</Badge>
                                )}
                              </div>
                              
                              {spouse.marriage_date && (
                                <div className="facebook-flex-start gap-2 mb-3 text-sm text-rose-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>تاريخ الزواج: <DateDisplay date={spouse.marriage_date} className="inline" /></span>
                                </div>
                              )}
                              
                              {/* Children for this spouse */}
                              {(() => {
                                const spouseChildren = getChildrenBySpouse(spouse.id);
                                if (spouseChildren.length > 0) {
                                  return (
                                    <div className="pt-3 border-t border-rose-200/50">
                                      <div className="facebook-text-caption text-rose-700 mb-3">الأطفال ({spouseChildren.length})</div>
                                      <div className="flex flex-wrap gap-2">
                                        {spouseChildren.map(child => (
                                          <div key={child.id} className="facebook-flex-start gap-2 bg-white/80 rounded-lg px-3 py-2 border border-rose-100">
                                            <Avatar className="h-8 w-8 facebook-avatar-sm">
                                              <AvatarImage src={child.image_url} />
                                              <AvatarFallback className={`${getGenderColor(child.gender)} text-white text-sm font-semibold`}>
                                                {child.name.charAt(0)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="facebook-text-body font-medium">{child.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Children */}
                  {children.length > 0 && (
                    <div className="facebook-post">
                      <div className="facebook-post-header">
                        <div className="facebook-flex-start gap-3">
                          <div className="facebook-card p-3 bg-green-500/10">
                            <Gift className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="facebook-post-author">الأطفال ({children.length})</h3>
                            <p className="facebook-post-time">الجيل التالي</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="facebook-card-grid">
                        {children.map(child => (
                          <div key={child.id} className="facebook-card p-4 hover:shadow-lg transition-all cursor-pointer">
                            <div className="text-center space-y-3">
                              <Avatar className="h-16 w-16 facebook-avatar-lg mx-auto border-2 border-green-200">
                                <AvatarImage src={child.image_url} />
                                <AvatarFallback className={`${getGenderColor(child.gender)} text-white font-bold`}>
                                  {child.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="facebook-text-body font-bold">{child.name}</div>
                                <div className="facebook-text-caption text-green-700">
                                  {child.gender === 'male' ? 'ابن' : 'ابنة'}
                                </div>
                                {child.birthDate && (
                                  <div className="facebook-text-caption mt-1">
                                    <DateDisplay date={child.birthDate} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="facebook-post">
                  <div className="facebook-post-header">
                    <div className="facebook-flex-start gap-3">
                      <div className="facebook-card p-3 bg-purple-500/10">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="facebook-post-author">الأحداث المهمة</h3>
                        <p className="facebook-post-time">مراحل الحياة</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Birth Event */}
                    {member.birthDate && (
                      <div className="facebook-flex-start gap-4 p-4 bg-blue-50 rounded-xl">
                        <div className="facebook-card p-3 bg-blue-500">
                          <Gift className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="facebook-text-body font-bold">الميلاد</div>
                          <div className="facebook-text-caption">
                            <DateDisplay date={member.birthDate} />
                            {member.birthPlace && ` في ${member.birthPlace}`}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Marriage Events */}
                    {spouses.map((spouse, index) => (
                      spouse.marriage_date && (
                        <div key={spouse.id} className="facebook-flex-start gap-4 p-4 bg-rose-50 rounded-xl">
                          <div className="facebook-card p-3 bg-rose-500">
                            <Heart className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <div className="facebook-text-body font-bold">الزواج من {spouse.name}</div>
                            <div className="facebook-text-caption">
                              <DateDisplay date={spouse.marriage_date} />
                            </div>
                          </div>
                        </div>
                      )
                    ))}

                    {/* Death Event */}
                    {member.deathDate && (
                      <div className="facebook-flex-start gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="facebook-card p-3 bg-gray-500">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="facebook-text-body font-bold">الوفاة</div>
                          <div className="facebook-text-caption">
                            <DateDisplay date={member.deathDate} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div className="facebook-post">
                  <div className="facebook-post-header">
                    <div className="facebook-flex-start gap-3">
                      <div className="facebook-card p-3 bg-indigo-500/10">
                        <Camera className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="facebook-post-author">الصور والذكريات</h3>
                        <p className="facebook-post-time">الوسائط المرفقة</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center py-12">
                    <Camera className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="facebook-text-body text-gray-500">لا توجد صور مرفقة حالياً</p>
                    <Button className="facebook-button-primary mt-4">
                      <Camera className="h-4 w-4 ml-2" />
                      إضافة صور
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="facebook-feed-sidebar-right space-y-6">
              {/* Quick Actions */}
              <div className="facebook-card p-4">
                <h4 className="facebook-text-heading text-sm mb-4">إجراءات سريعة</h4>
                <div className="space-y-3">
                  <Button 
                    onClick={onEdit} 
                    className="facebook-button-primary w-full"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل المعلومات
                  </Button>
                  <Button 
                    variant="outline" 
                    className="facebook-button-secondary w-full"
                    size="sm"
                  >
                    <MessageCircle className="h-4 w-4 ml-2" />
                    إضافة ملاحظة
                  </Button>
                  <Button 
                    variant="outline" 
                    className="facebook-button-secondary w-full"
                    size="sm"
                  >
                    <Share2 className="h-4 w-4 ml-2" />
                    مشاركة الملف
                  </Button>
                </div>
              </div>

              {/* Family Stats */}
              <div className="facebook-card p-4">
                <h4 className="facebook-text-heading text-sm mb-4">إحصائيات العائلة</h4>
                <div className="space-y-3">
                  <div className="facebook-flex-between">
                    <span className="facebook-text-caption">الأطفال</span>
                    <span className="facebook-text-body font-semibold">{children.length}</span>
                  </div>
                  <div className="facebook-flex-between">
                    <span className="facebook-text-caption">الأزواج</span>
                    <span className="facebook-text-body font-semibold">{spouses.length}</span>
                  </div>
                  <div className="facebook-flex-between">
                    <span className="facebook-text-caption">الجيل</span>
                    <span className="facebook-text-body font-semibold">
                      {(father || mother) ? 'الثاني' : 'الأول'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete Action */}
              <div className="facebook-card p-4 border-destructive/20">
                <h4 className="facebook-text-heading text-sm mb-4 text-destructive">منطقة الخطر</h4>
                <Button 
                  onClick={onDelete}
                  variant="destructive" 
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف العضو
                </Button>
                <p className="facebook-text-caption text-destructive/70 mt-2 text-center">
                  هذا الإجراء لا يمكن التراجع عنه
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};