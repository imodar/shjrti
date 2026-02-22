import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Member, Marriage } from '@/types/family.types';

interface WelcomeCardProps {
  userName: string;
  familyMembers: Member[];
  marriages: Marriage[];
}

const floatingIcons = [
  { icon: 'family_restroom', x: 5, y: 10, size: 32, dur: 4, delay: 0 },
  { icon: 'favorite', x: 82, y: 15, size: 24, dur: 3.5, delay: 0.6 },
  { icon: 'park', x: 20, y: 65, size: 28, dur: 5, delay: 1.2 },
  { icon: 'diversity_3', x: 65, y: 60, size: 30, dur: 4.5, delay: 0.3 },
  { icon: 'auto_stories', x: 45, y: 12, size: 22, dur: 3.8, delay: 1.8 },
  { icon: 'cake', x: 90, y: 55, size: 20, dur: 4.2, delay: 0.9 },
  { icon: 'diversity_1', x: 10, y: 40, size: 26, dur: 3.2, delay: 1.5 },
  { icon: 'star', x: 75, y: 38, size: 18, dur: 5.5, delay: 2.1 },
];

export const StitchWelcomeCard: React.FC<WelcomeCardProps> = ({ userName, familyMembers }) => {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-emerald-600 dark:from-primary/80 dark:via-primary/90 dark:to-emerald-700 p-6 shadow-xl group mb-6">
      {/* Floating animated icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((item, i) => (
          <span
            key={i}
            className="material-symbols-outlined absolute"
            style={{
              fontSize: item.size,
              left: `${item.x}%`,
              top: `${item.y}%`,
              color: i % 2 === 0 ? 'rgba(251,191,36,0.25)' : 'rgba(251,146,60,0.25)',
              animation: `welcomeFloat ${item.dur}s ease-in-out infinite`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.icon}
          </span>
        ))}
      </div>

      <div className="relative z-10 flex items-center gap-5">
        {/* Animated avatar circle */}
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-amber-300/40 group-hover:scale-110 transition-transform duration-500">
          <span className="material-symbols-outlined text-amber-300 text-3xl" style={{ animation: 'waveHand 2s ease-in-out infinite' }}>waving_hand</span>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">
            {t('stitch.welcome_back', 'مرحباً بعودتك')}، {userName}!
          </h2>
          <p className="text-white/80 text-sm">
            {t('stitch.whats_happening', 'إليك ما يحدث في شجرة عائلتك اليوم')}
          </p>
        </div>

        {/* Quick stat badge */}
        <div className="hidden sm:flex gap-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-amber-300/30 hover:bg-white/30 transition-colors">
            <div className="text-2xl font-bold text-amber-200">{familyMembers.length}</div>
            <div className="text-[10px] text-white/70 font-medium">{t('stitch.members', 'عضو')}</div>
          </div>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <style>{`
        @keyframes welcomeFloat {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-8px) rotate(5deg) scale(1.05); }
          50% { transform: translateY(-14px) rotate(-3deg) scale(1.1); }
          75% { transform: translateY(-6px) rotate(4deg) scale(1.03); }
        }
        @keyframes waveHand {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(14deg); }
          30% { transform: rotate(-8deg); }
          45% { transform: rotate(14deg); }
          60% { transform: rotate(-4deg); }
          75% { transform: rotate(10deg); }
          85% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default StitchWelcomeCard;
