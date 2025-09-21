import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Skull } from "lucide-react";
import { Member } from "../../types/family.types";

interface MemberAvatarProps {
  member: Member;
  getGenderColor: (gender: string) => string;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  member,
  getGenderColor
}) => {
  return (
    <div className="relative group">
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-full blur-sm opacity-20 group-hover:opacity-40 transition-opacity duration-300 ${
        member.is_founder 
          ? 'bg-gradient-to-br from-amber-400 to-yellow-500' 
          : member.gender === 'male' 
          ? 'bg-gradient-to-br from-blue-400 to-indigo-500' 
          : 'bg-gradient-to-br from-rose-400 to-pink-500'
      }`} />
      
      <Avatar className="relative h-12 w-12 ring-2 ring-background/80 shadow-lg group-hover:ring-primary/30 transition-all duration-300">
        <AvatarImage src={(member as any).image} className="object-cover" />
        <AvatarFallback className={`${getGenderColor(member.gender)} text-sm font-bold`}>
          {((member as any).name || member.first_name || "؟").charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      {/* Status indicators */}
      {member.is_founder && (
        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-1 shadow-lg animate-pulse">
          <Crown className="h-3 w-3 text-white drop-shadow-sm" />
        </div>
      )}
      {!(member as any).isAlive && (
        <div className="absolute -bottom-1 -left-1 bg-gradient-to-r from-gray-500 to-slate-600 rounded-full p-1 shadow-lg">
          <Skull className="h-3 w-3 text-white drop-shadow-sm" />
        </div>
      )}
    </div>
  );
};