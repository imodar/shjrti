import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Member, Marriage } from "../../types/family.types";
import { MemberAvatar } from "./MemberAvatar";
import { MemberInfo } from "./MemberInfo";
import { MemberRelationships } from "./MemberRelationships";

interface MemberCardProps {
  member: Member;
  familyMembers: Member[];
  marriages: Marriage[];
  onViewMember: (member: Member) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (member: Member) => void;
  onSpouseEditAttempt: (member: Member) => void;
  checkIfMemberIsSpouse: (member: Member) => boolean;
  getGenderColor: (gender: string) => string;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  familyMembers,
  marriages,
  onViewMember,
  onEditMember,
  onDeleteMember,
  onSpouseEditAttempt,
  checkIfMemberIsSpouse,
  getGenderColor
}) => {
  return (
    <Card 
      className="group relative cursor-pointer overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10"
      onClick={() => onViewMember(member)}
    >
      {/* Glassmorphism background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95 backdrop-blur-xl border-0" />
      <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br ${
        member.is_founder 
          ? 'from-amber-500 to-yellow-400' 
          : member.gender === 'male' 
          ? 'from-blue-500 to-indigo-400' 
          : 'from-rose-500 to-pink-400'
      }`} />
      
      {/* Dynamic top accent */}
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
        member.is_founder 
          ? 'from-amber-400 via-yellow-500 to-amber-400' 
          : member.gender === 'male' 
          ? 'from-blue-400 via-indigo-500 to-blue-400' 
          : 'from-rose-400 via-pink-500 to-rose-400'
      } shadow-lg`} />
      
      {/* Floating orbs animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-4 right-6 w-20 h-20 rounded-full opacity-5 blur-2xl ${
          member.is_founder ? 'bg-amber-400' : member.gender === 'male' ? 'bg-blue-400' : 'bg-rose-400'
        } group-hover:opacity-10 transition-opacity duration-700`} />
        <div className={`absolute bottom-6 left-4 w-16 h-16 rounded-full opacity-5 blur-2xl ${
          member.is_founder ? 'bg-yellow-400' : member.gender === 'male' ? 'bg-indigo-400' : 'bg-pink-400'
        } group-hover:opacity-10 transition-opacity duration-700`} />
      </div>

      <CardContent className="relative p-2.5 space-y-1.5">
        {/* Center avatar */}
        <div className="flex justify-center">
          <MemberAvatar member={member} getGenderColor={getGenderColor} />
        </div>

        {/* Member info */}
        <MemberInfo member={member}>
          <MemberRelationships 
            member={member} 
            familyMembers={familyMembers} 
            marriages={marriages} 
          />
        </MemberInfo>

        {/* Interactive hover glow */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className={`absolute inset-0 rounded-lg shadow-2xl ${
            member.is_founder 
              ? 'shadow-amber-500/20' 
              : member.gender === 'male' 
              ? 'shadow-blue-500/20' 
              : 'shadow-rose-500/20'
          }`} />
        </div>
      </CardContent>
    </Card>
  );
};