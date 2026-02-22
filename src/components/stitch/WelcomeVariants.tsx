import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Member, Marriage } from '@/types/family.types';

interface WelcomeVariantsProps {
  userName: string;
  familyMembers: Member[];
  marriages: Marriage[];
}

// ==================== OPTION 1: Animated Card with Icons ====================
const AnimatedIconsWelcome: React.FC<WelcomeVariantsProps> = ({ userName, familyMembers }) => {
  const { t } = useLanguage();
  const icons = ['family_restroom', 'favorite', 'park', 'diversity_3', 'auto_stories', 'cake'];
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-emerald-600 dark:from-primary/80 dark:via-primary/90 dark:to-emerald-700 p-6 shadow-xl group">
      {/* Floating animated icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {icons.map((icon, i) => (
          <span
            key={i}
            className="material-symbols-outlined absolute text-white/10 animate-pulse"
            style={{
              fontSize: `${28 + (i % 3) * 12}px`,
              top: `${10 + (i * 15) % 80}%`,
              left: `${5 + (i * 18) % 90}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          >
            {icon}
          </span>
        ))}
      </div>
      
      <div className="relative z-10 flex items-center gap-5">
        {/* Animated avatar circle */}
        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 group-hover:scale-110 transition-transform duration-500">
          <span className="material-symbols-outlined text-white text-3xl">waving_hand</span>
        </div>
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">
            {t('stitch.welcome_back', 'مرحباً بعودتك')}، {userName}!
          </h2>
          <p className="text-white/80 text-sm">
            {t('stitch.whats_happening', 'إليك ما يحدث في شجرة عائلتك اليوم')}
          </p>
        </div>
        
        {/* Quick stat badges */}
        <div className="hidden sm:flex gap-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-white/20 hover:bg-white/30 transition-colors">
            <div className="text-2xl font-bold text-white">{familyMembers.length}</div>
            <div className="text-[10px] text-white/70 font-medium">{t('stitch.members', 'عضو')}</div>
          </div>
        </div>
      </div>
      
      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      {/* Label */}
      <div className="absolute top-2 left-2 bg-black/30 text-white text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm">
        الخيار 1: بطاقة متحركة مع أيقونات
      </div>
    </div>
  );
};

// ==================== OPTION 2: Animated Quick Stats ====================
const AnimatedStatsWelcome: React.FC<WelcomeVariantsProps> = ({ userName, familyMembers, marriages }) => {
  const { t } = useLanguage();
  const [animatedCounts, setAnimatedCounts] = useState({ members: 0, marriages: 0, generations: 0 });
  
  const generationCount = useMemo(() => {
    const getGen = (m: any, depth = 0): number => {
      if (!m.father_id && !m.fatherId) return depth;
      const parent = familyMembers.find((p: any) => p.id === (m.father_id || m.fatherId));
      return parent ? getGen(parent, depth + 1) : depth;
    };
    return familyMembers.length > 0 ? Math.max(...familyMembers.map(m => getGen(m))) + 1 : 0;
  }, [familyMembers]);

  useEffect(() => {
    const targets = { members: familyMembers.length, marriages: marriages.length, generations: generationCount };
    const duration = 1200;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedCounts({
        members: Math.round(targets.members * ease),
        marriages: Math.round(targets.marriages * ease),
        generations: Math.round(targets.generations * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [familyMembers.length, marriages.length, generationCount]);

  const stats = [
    { icon: 'groups', label: t('stitch.members', 'الأعضاء'), value: animatedCounts.members, color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: 'favorite', label: t('stitch.marriages', 'الزيجات'), value: animatedCounts.marriages, color: 'from-pink-500 to-rose-400', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { icon: 'account_tree', label: t('stitch.generations', 'الأجيال'), value: animatedCounts.generations, color: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ];

  return (
    <div className="relative rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-100 dark:border-slate-800">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('stitch.welcome_back', 'مرحباً بعودتك')}، {userName}! 👋
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {t('stitch.whats_happening', 'إليك ملخص سريع عن شجرة عائلتك')}
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} rounded-xl p-4 text-center group hover:scale-105 transition-all duration-300 cursor-default`}
          >
            <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform duration-300`}>
              <span className="material-symbols-outlined text-white text-lg">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {stat.value}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
      
      {/* Label */}
      <div className="absolute top-2 left-2 bg-slate-900/70 dark:bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm">
        الخيار 2: إحصائيات سريعة متحركة
      </div>
    </div>
  );
};

// ==================== OPTION 3: Banner with Floating Animations ====================
const AnimatedBannerWelcome: React.FC<WelcomeVariantsProps> = ({ userName }) => {
  const { t } = useLanguage();
  const [displayText, setDisplayText] = useState('');
  const fullText = `${t('stitch.welcome_back', 'مرحباً بعودتك')}، ${userName}!`;

  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setDisplayText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [fullText]);

  const floatingIcons = [
    { icon: 'park', x: 8, y: 15, size: 32, delay: 0 },
    { icon: 'favorite', x: 85, y: 20, size: 24, delay: 1 },
    { icon: 'star', x: 25, y: 70, size: 20, delay: 0.5 },
    { icon: 'family_restroom', x: 70, y: 65, size: 28, delay: 1.5 },
    { icon: 'auto_stories', x: 50, y: 25, size: 22, delay: 2 },
    { icon: 'cake', x: 15, y: 50, size: 20, delay: 0.8 },
    { icon: 'diversity_1', x: 90, y: 50, size: 26, delay: 1.2 },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{ minHeight: 140 }}>
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(-45deg, #0d9488, #0891b2, #6366f1, #8b5cf6)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 8s ease infinite',
        }}
      />
      
      {/* Floating icons */}
      {floatingIcons.map((item, i) => (
        <span
          key={i}
          className="material-symbols-outlined absolute text-white/15"
          style={{
            fontSize: item.size,
            left: `${item.x}%`,
            top: `${item.y}%`,
            animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.icon}
        </span>
      ))}
      
      {/* Content */}
      <div className="relative z-10 p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
          <span className="material-symbols-outlined text-white text-2xl">account_tree</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white min-h-[32px]">
            {displayText}
            <span className="inline-block w-0.5 h-6 bg-white/70 ml-1 animate-pulse align-middle" />
          </h2>
          <p className="text-white/70 text-sm mt-1">
            {t('stitch.whats_happening', 'إليك ما يحدث في شجرة عائلتك اليوم')}
          </p>
        </div>
      </div>
      
      {/* Label */}
      <div className="absolute top-2 left-2 bg-black/30 text-white text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm z-20">
        الخيار 3: بانر مع رسوم متحركة
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};

// ==================== OPTION 4: Time-of-Day Interactive Card ====================
const TimeOfDayWelcome: React.FC<WelcomeVariantsProps> = ({ userName, familyMembers }) => {
  const { t } = useLanguage();
  const hour = new Date().getHours();
  
  const timeConfig = useMemo(() => {
    if (hour >= 5 && hour < 12) return {
      greeting: t('stitch.good_morning', 'صباح الخير'),
      icon: 'wb_sunny',
      gradient: 'from-amber-400 via-orange-400 to-yellow-300',
      iconColor: 'text-amber-500',
      bgAccent: 'bg-amber-50 dark:bg-amber-900/20',
      emoji: '☀️',
    };
    if (hour >= 12 && hour < 17) return {
      greeting: t('stitch.good_afternoon', 'مساء النور'),
      icon: 'wb_twilight',
      gradient: 'from-sky-400 via-blue-400 to-indigo-400',
      iconColor: 'text-sky-500',
      bgAccent: 'bg-sky-50 dark:bg-sky-900/20',
      emoji: '🌤️',
    };
    if (hour >= 17 && hour < 21) return {
      greeting: t('stitch.good_evening', 'مساء الخير'),
      icon: 'wb_twilight',
      gradient: 'from-orange-500 via-rose-500 to-purple-500',
      iconColor: 'text-orange-500',
      bgAccent: 'bg-orange-50 dark:bg-orange-900/20',
      emoji: '🌅',
    };
    return {
      greeting: t('stitch.good_night', 'مساء الخير'),
      icon: 'dark_mode',
      gradient: 'from-indigo-600 via-purple-600 to-slate-700',
      iconColor: 'text-indigo-400',
      bgAccent: 'bg-indigo-50 dark:bg-indigo-900/20',
      emoji: '🌙',
    };
  }, [hour, t]);

  return (
    <div className="relative rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Top gradient bar */}
      <div className={`h-1.5 bg-gradient-to-r ${timeConfig.gradient}`} />
      
      <div className="p-6">
        <div className="flex items-center gap-5">
          {/* Animated sun/moon icon */}
          <div className={`w-16 h-16 rounded-2xl ${timeConfig.bgAccent} flex items-center justify-center relative`}>
            <span 
              className={`material-symbols-outlined ${timeConfig.iconColor} text-3xl`}
              style={{ animation: 'sunRotate 6s linear infinite' }}
            >
              {timeConfig.icon}
            </span>
            {/* Rays effect */}
            <div className="absolute inset-0 rounded-2xl" style={{
              background: `radial-gradient(circle, ${hour >= 21 || hour < 5 ? 'rgba(129,140,248,0.15)' : 'rgba(251,191,36,0.15)'} 0%, transparent 70%)`,
              animation: 'pulse 3s ease-in-out infinite',
            }} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{timeConfig.emoji}</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {timeConfig.greeting}، {userName}
              </h2>
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {/* Mini tree summary */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-primary">account_tree</span>
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{familyMembers.length}</div>
              <div className="text-[10px] text-slate-500">{t('stitch.total_members', 'إجمالي الأعضاء')}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Label */}
      <div className="absolute top-3 left-2 bg-slate-900/70 dark:bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm z-10">
        الخيار 4: بطاقة تفاعلية مع وقت اليوم
      </div>

      <style>{`
        @keyframes sunRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ==================== Combined Preview ====================
export const WelcomeVariantsPreview: React.FC<WelcomeVariantsProps> = (props) => {
  return (
    <div className="space-y-6">
      <AnimatedIconsWelcome {...props} />
      <AnimatedStatsWelcome {...props} />
      <AnimatedBannerWelcome {...props} />
      <TimeOfDayWelcome {...props} />
    </div>
  );
};

// Export individual variants for final selection
export { AnimatedIconsWelcome, AnimatedStatsWelcome, AnimatedBannerWelcome, TimeOfDayWelcome };
