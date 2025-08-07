import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Heart, Skull, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface FamilyMember {
  id: string;
  name: string;
  gender: string;
  isAlive: boolean;
  image?: string;
  isFounder?: boolean;
  relatedPersonId?: string;
  relation?: string;
}

interface FamilyMemberCardProps {
  member: FamilyMember;
  familyMembers: FamilyMember[];
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
  getAdditionalInfo: (member: FamilyMember) => string | null;
  getFullName: (member: FamilyMember) => string;
  checkIfMemberIsSpouse: (member: FamilyMember) => boolean;
}

export const FamilyMemberCard = ({
  member,
  familyMembers,
  onEdit,
  onDelete,
  getAdditionalInfo,
  getFullName,
  checkIfMemberIsSpouse
}: FamilyMemberCardProps) => {
  const { t } = useLanguage();

  return (
    <Card className="group bg-card/80 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:bg-card/90">
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-4 right-6 w-2 h-2 bg-primary/30 rounded-full animate-pulse"></div>
        <div className="absolute top-8 right-12 w-1 h-1 bg-accent/40 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-secondary/30 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
      </div>

      <CardContent className="relative z-10 p-0">
        {/* Header Section */}
        <div className="relative p-6 bg-gradient-to-r from-white/10 via-white/5 to-transparent">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative group/avatar">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg group-hover/avatar:border-primary/50 transition-all duration-300">
                <Avatar className="w-full h-full rounded-2xl">
                  <AvatarImage src={member.image || undefined} className="object-cover group-hover/avatar:scale-110 transition-transform duration-500" />
                  <AvatarFallback className="bg-gradient-to-br from-primary via-accent to-secondary text-white font-bold text-lg rounded-2xl">
                    {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-lg",
                  member.isAlive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                )}></div>
              </div>
            </div>
            
            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-foreground text-xl leading-tight truncate group-hover:text-primary transition-colors duration-300">
                  {member.name}
                </h3>
                <Badge className={cn(
                  "px-3 py-1 rounded-full font-medium text-xs border-0 shadow-md transition-all duration-300 group-hover:scale-105",
                  member.gender === "male" 
                    ? "bg-blue-100 text-blue-700 shadow-blue-200/50" 
                    : "bg-pink-100 text-pink-700 shadow-pink-200/50"
                )}>
                  {member.gender === "male" ? `👨 ${t('family_builder.male', 'ذكر')}` : `👩 ${t('family_builder.female', 'أنثى')}`}
                </Badge>
              </div>
              
              {/* Additional info */}
              {(() => {
                const additionalInfo = getAdditionalInfo(member);
                return additionalInfo ? (
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed">
                      {additionalInfo}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-90 group-hover:bg-primary/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
                {!checkIfMemberIsSpouse(member) && (
                  <DropdownMenuItem onClick={() => onEdit(member)} className="gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Edit className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{t('family_builder.edit_data', 'تعديل البيانات')}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                {!member.isFounder && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(member.id)}
                    className="gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive"
                  >
                    <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                      <Trash2 className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{t('family_builder.delete_from_family', 'حذف من العائلة')}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          {/* Relation Card */}
          <div className="relative group/relation">
            {member.relatedPersonId ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">{t(member.relation || '', member.relation || '')}</span>
                <span className="font-bold text-primary">
                  {(() => {
                    const relatedPerson = familyMembers.find(m => m.id === member.relatedPersonId);
                    return relatedPerson ? getFullName(relatedPerson) : t('family_builder.unspecified', 'غير محدد');
                  })()}
                </span>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>
            ) : null}
          </div>

          {/* Status Card */}
          <div className="flex justify-center">
            <div className={cn(
              "relative group/status inline-flex items-center gap-3 px-6 py-3 rounded-2xl font-medium text-sm shadow-lg transition-all duration-300 hover:scale-105 border",
              member.isAlive 
                ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200 text-green-700 hover:shadow-green-200/50" 
                : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600 hover:shadow-gray-200/50"
            )}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover/status:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-3">
                {member.isAlive ? (
                  <>
                    <div className="relative">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                    </div>
                    <span className="font-semibold">{t('family_builder.alive', 'على قيد الحياة')}</span>
                    <Heart className="h-4 w-4 text-green-600 animate-pulse" />
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="font-semibold">{t('family_builder.deceased', 'متوفى')}</span>
                    <Skull className="h-4 w-4 text-gray-500" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};