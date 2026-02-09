import React, { useMemo } from 'react';
import { Member, Marriage } from '@/types/family.types';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatisticsViewProps {
  familyMembers: Member[];
  marriages: Marriage[];
}

export const StitchStatisticsView: React.FC<StatisticsViewProps> = ({
  familyMembers,
  marriages,
}) => {
  const { t } = useLanguage();

  const stats = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();

    // --- Generation calculation ---
    const generationMap = new Map<string, number>();
    familyMembers.forEach(m => {
      if (m.is_founder) generationMap.set(m.id, 1);
    });
    let changed = true;
    let iter = 0;
    while (changed && iter < 50) {
      changed = false;
      iter++;
      familyMembers.forEach(m => {
        if (!generationMap.has(m.id)) {
          const fGen = m.father_id ? generationMap.get(m.father_id) : undefined;
          const mGen = m.mother_id ? generationMap.get(m.mother_id) : undefined;
          if (fGen !== undefined || mGen !== undefined) {
            generationMap.set(m.id, Math.max(fGen || 0, mGen || 0) + 1);
            changed = true;
          }
        }
      });
    }
    // Assign spouses
    marriages.forEach(mar => {
      const hGen = generationMap.get(mar.husband_id);
      const wGen = generationMap.get(mar.wife_id);
      if (hGen && !wGen) generationMap.set(mar.wife_id, hGen);
      else if (wGen && !hGen) generationMap.set(mar.husband_id, wGen);
    });

    const maxGeneration = generationMap.size > 0 ? Math.max(...generationMap.values()) : 1;

    // --- Age calculation helper ---
    const getAge = (birthDateStr: string | null | undefined): number | null => {
      if (!birthDateStr) return null;
      const birth = new Date(birthDateStr);
      const age = currentYear - birth.getFullYear();
      return age;
    };

    // --- Basic counts ---
    const totalMembers = familyMembers.length;
    const males = familyMembers.filter(m => m.gender === 'male');
    const females = familyMembers.filter(m => m.gender === 'female');
    const living = familyMembers.filter(m => m.is_alive !== false);
    const deceased = familyMembers.filter(m => m.is_alive === false);
    const totalMarriages = marriages.length;

    // Under 18 & Over 60
    const under18 = living.filter(m => {
      const age = getAge(m.birth_date);
      return age !== null && age < 18;
    }).length;
    const over60 = living.filter(m => {
      const age = getAge(m.birth_date);
      return age !== null && age >= 60;
    }).length;

    // Family Vitality: avg children per marriage
    const childrenPerMarriage = totalMarriages > 0
      ? (familyMembers.filter(m => m.father_id || m.mother_id).length / totalMarriages).toFixed(1)
      : '0';

    // --- Gender by generation ---
    const genderByGen: { gen: number; males: number; females: number }[] = [];
    for (let g = 1; g <= maxGeneration; g++) {
      const membersInGen = familyMembers.filter(m => generationMap.get(m.id) === g);
      genderByGen.push({
        gen: g,
        males: membersInGen.filter(m => m.gender === 'male').length,
        females: membersInGen.filter(m => m.gender === 'female').length,
      });
    }

    // --- Top surnames (last_name) ---
    const surnameCount = new Map<string, number>();
    familyMembers.forEach(m => {
      const surname = m.last_name?.trim();
      if (surname) {
        surnameCount.set(surname, (surnameCount.get(surname) || 0) + 1);
      }
    });
    const topSurnames = Array.from(surnameCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // --- Common first names ---
    const firstNameCount = new Map<string, number>();
    familyMembers.forEach(m => {
      const firstName = (m.first_name || m.name?.split(' ')[0])?.trim();
      if (firstName) {
        firstNameCount.set(firstName, (firstNameCount.get(firstName) || 0) + 1);
      }
    });
    const topFirstNames = Array.from(firstNameCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // --- Monthly birthday grid ---
    const monthlyBirthdays = Array(12).fill(0);
    familyMembers.forEach(m => {
      if (m.birth_date) {
        const month = new Date(m.birth_date).getMonth();
        monthlyBirthdays[month]++;
      }
    });
    const monthNames = [
      t('stats.month_jan', 'Jan'), t('stats.month_feb', 'Feb'), t('stats.month_mar', 'Mar'),
      t('stats.month_apr', 'Apr'), t('stats.month_may', 'May'), t('stats.month_jun', 'Jun'),
      t('stats.month_jul', 'Jul'), t('stats.month_aug', 'Aug'), t('stats.month_sep', 'Sep'),
      t('stats.month_oct', 'Oct'), t('stats.month_nov', 'Nov'), t('stats.month_dec', 'Dec'),
    ];
    const currentMonth = today.getMonth();
    const maxMonthly = Math.max(...monthlyBirthdays, 1);

    // --- Tree completeness ---
    const withPhotos = familyMembers.filter(m => m.image_url).length;
    const withBirthDate = familyMembers.filter(m => m.birth_date).length;
    const withBiography = familyMembers.filter(m => m.biography).length;
    const completenessScore = totalMembers > 0
      ? Math.round(((withPhotos + withBirthDate + withBiography) / (totalMembers * 3)) * 100)
      : 0;
    const photoPct = totalMembers > 0 ? Math.round((withPhotos / totalMembers) * 100) : 0;
    const birthPct = totalMembers > 0 ? Math.round((withBirthDate / totalMembers) * 100) : 0;
    const bioPct = totalMembers > 0 ? Math.round((withBiography / totalMembers) * 100) : 0;

    // --- Year span ---
    const birthYears = familyMembers
      .filter(m => m.birth_date)
      .map(m => new Date(m.birth_date!).getFullYear());
    const yearSpan = birthYears.length > 0 ? currentYear - Math.min(...birthYears) : 0;

    return {
      totalMembers,
      maleCount: males.length,
      femaleCount: females.length,
      livingCount: living.length,
      deceasedCount: deceased.length,
      livingPct: totalMembers > 0 ? Math.round((living.length / totalMembers) * 100) : 0,
      maxGeneration,
      yearSpan,
      totalMarriages,
      under18,
      under18Pct: totalMembers > 0 ? Math.round((under18 / totalMembers) * 100) : 0,
      over60,
      childrenPerMarriage,
      genderByGen,
      topSurnames,
      topFirstNames,
      monthlyBirthdays,
      monthNames,
      currentMonth,
      maxMonthly,
      completenessScore,
      photoPct,
      birthPct,
      bioPct,
    };
  }, [familyMembers, marriages]);

  return (
    <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background custom-scrollbar p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Title */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t('stats.title', 'Advanced Family Analytics Hub')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {t('stats.subtitle', "Deep insights into your family's history, demographics, and activities.")}
            </p>
          </div>
        </div>

        {/* Row 1: Core Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="groups"
            iconColor="text-primary"
            label={t('stats.total_members', 'Total Members')}
            value={stats.totalMembers}
            sub={`${stats.maleCount} ${t('stats.male', 'Male')} • ${stats.femaleCount} ${t('stats.female', 'Female')}`}
          />
          <StatCard
            icon="account_tree"
            iconColor="text-secondary"
            label={t('stats.generations', 'Generations')}
            value={stats.maxGeneration}
            sub={stats.yearSpan > 0 ? `${t('stats.spanning', 'Spanning')} ${stats.yearSpan} ${t('stats.years', 'years')}` : undefined}
          />
          <StatCard
            icon="favorite"
            iconColor="text-emerald-500"
            label={t('stats.living', 'Living Members')}
            value={stats.livingCount}
            sub={`${stats.livingPct}% ${t('stats.of_tree', 'of tree')}`}
          />
          <StatCard
            icon="history_edu"
            iconColor="text-amber-600"
            label={t('stats.deceased', 'Deceased')}
            value={stats.deceasedCount}
            sub={t('stats.ancestors_recorded', 'Ancestors recorded')}
          />
        </div>

        {/* Row 2: Extended Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon="favorite"
            iconColor="text-pink-500"
            label={t('stats.marriages', 'Total Marriages')}
            value={stats.totalMarriages}
            sub={t('stats.recorded_unions', 'Recorded unions')}
          />
          <StatCard
            icon="child_care"
            iconColor="text-blue-500"
            label={t('stats.under_18', 'Under 18s')}
            value={stats.under18}
            sub={`${stats.under18Pct}% ${t('stats.of_population', 'of population')}`}
          />
          <StatCard
            icon="elderly"
            iconColor="text-amber-500"
            label={t('stats.over_60', 'Over 60s')}
            value={stats.over60}
            sub={t('stats.active_elders', 'Active elders')}
          />
          <div className="bg-primary/10 border-primary/20 p-6 rounded-3xl border shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 end-0 p-4 opacity-20 group-hover:scale-110 transition-transform text-primary">
              <span className="material-symbols-outlined text-6xl">bolt</span>
            </div>
            <p className="text-sm font-bold text-primary mb-1">{t('stats.family_vitality', 'Family Vitality')}</p>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.childrenPerMarriage}</div>
            <p className="text-[10px] text-slate-500 mt-2 uppercase font-bold">
              {t('stats.avg_children_per_marriage', 'Avg children per marriage')}
            </p>
          </div>
        </div>

        {/* Gender Distribution by Generation */}
        {stats.genderByGen.length > 0 && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bar_chart_4_bars</span>
                {t('stats.gender_by_gen', 'Gender Distribution by Generation')}
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-primary" /> {t('stats.male', 'Male')}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-secondary" /> {t('stats.female', 'Female')}
                </div>
              </div>
            </div>
            <div className="flex items-end gap-4 px-4" style={{ height: '12rem' }}>
              {(() => {
                const maxCount = Math.max(...stats.genderByGen.flatMap(g => [g.males, g.females]), 1);
                return stats.genderByGen.map(({ gen, males, females }) => {
                  const maleH = Math.round((males / maxCount) * 160);
                  const femaleH = Math.round((females / maxCount) * 160);
                  return (
                    <div key={gen} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="w-full flex items-end justify-center gap-1 flex-1">
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[9px] font-bold text-primary mb-0.5">{males}</span>
                          <div className="w-full bg-primary rounded-t-md" style={{ height: `${maleH}px` }} />
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[9px] font-bold text-secondary mb-0.5">{females}</span>
                          <div className="w-full bg-secondary rounded-t-md" style={{ height: `${femaleH}px` }} />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                        {t('stats.gen', 'Gen')} {gen}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Row: Surnames + First Names */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Surnames */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-6">
              {t('stats.top_surnames', 'Top Surnames')}
            </h3>
            <div className="flex flex-wrap gap-2 items-center justify-center min-h-[8rem]">
              {stats.topSurnames.length > 0 ? stats.topSurnames.map(([name, count], i) => {
                const sizes = ['text-2xl font-bold text-primary', 'text-xl font-semibold text-secondary', 'text-lg font-medium text-slate-500', 'text-base font-medium text-slate-400', 'text-sm font-medium text-slate-300'];
                return <span key={name} className={sizes[i] || sizes[4]}>{name}</span>;
              }) : (
                <p className="text-sm text-slate-400">{t('stats.no_surnames', 'No surnames recorded')}</p>
              )}
            </div>
          </div>

          {/* Common First Names */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-secondary">format_list_numbered</span>
              {t('stats.common_names', 'Common First Names')}
            </h3>
            <div className="space-y-4">
              {stats.topFirstNames.length > 0 ? stats.topFirstNames.map(([name, count], i) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold">{name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{count} {t('stats.occurrences', 'Occurrences')}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-4">{t('stats.no_names', 'No names recorded')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Birthday Grid + Tree Completeness */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Birthdays */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              {t('stats.birthday_grid', 'Monthly Birthday Grid')}
            </h3>
            <div className="grid grid-cols-6 gap-3">
              {stats.monthlyBirthdays.map((count, i) => {
                const isCurrentMonth = i === stats.currentMonth;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-center ${
                      isCurrentMonth
                        ? 'bg-primary/10 border-primary/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className={`text-[10px] font-bold uppercase ${isCurrentMonth ? 'text-primary' : 'text-slate-400'}`}>
                      {stats.monthNames[i]}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {String(count).padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tree Completeness */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500">task_alt</span>
                {t('stats.tree_completeness', 'Tree Completeness')}
              </h3>
            </div>
            <div className="flex items-center gap-8 flex-1">
              {/* Circular progress */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-slate-100 dark:text-slate-800" cx="50" cy="50" fill="transparent" r="45" stroke="currentColor" strokeWidth="8" />
                  <circle
                    className="text-primary"
                    cx="50" cy="50" fill="transparent" r="45"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="282.7"
                    strokeDashoffset={282.7 - (282.7 * stats.completenessScore) / 100}
                  />
                </svg>
                <span className="absolute text-2xl font-bold">{stats.completenessScore}%</span>
              </div>
              <div className="flex-1 space-y-4">
                <ProgressRow label={t('stats.with_photos', 'Profiles with Photos')} pct={stats.photoPct} color="bg-primary" />
                <ProgressRow label={t('stats.birth_dates', 'Birth Dates Added')} pct={stats.birthPct} color="bg-secondary" />
                <ProgressRow label={t('stats.biographies', 'Biographies Added')} pct={stats.bioPct} color="bg-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Sub-components ---

const StatCard: React.FC<{
  icon: string;
  iconColor: string;
  label: string;
  value: number | string;
  sub?: string;
}> = ({ icon, iconColor, label, value, sub }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
    <div className={`absolute top-0 end-0 p-4 opacity-10 group-hover:scale-110 transition-transform ${iconColor}`}>
      <span className="material-symbols-outlined text-6xl">{icon}</span>
    </div>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
    <div className="text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
    {sub && <div className="mt-2 text-xs text-slate-400 font-medium">{sub}</div>}
  </div>
);

const ProgressRow: React.FC<{ label: string; pct: number; color: string }> = ({ label, pct, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1.5 font-bold">
      <span className="text-slate-500">{label}</span>
      <span>{pct}%</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

export default StitchStatisticsView;
