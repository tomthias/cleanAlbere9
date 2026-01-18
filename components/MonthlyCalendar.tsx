
import React, { useMemo } from 'react';
import { CleaningWeek, UserProgress, Person } from '../types';
import { AREAS } from '../constants';
import * as LucideIcons from 'lucide-react';

interface MonthlyCalendarProps {
  weeks: CleaningWeek[];
  progress: UserProgress;
  onToggle: (weekId: number, area: string) => void;
  lang: 'it' | 'en';
  customColors?: Record<Person, string>;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ weeks, progress, onToggle, lang, customColors }) => {
  const months = useMemo(() => {
    const groups: { [key: string]: CleaningWeek[] } = {};
    const locale = lang === 'it' ? 'it-IT' : 'en-US';
    
    weeks.forEach(week => {
      const thursday = new Date(week.startDate);
      thursday.setDate(week.startDate.getDate() + 3);
      
      const monthYear = thursday.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(week);
    });

    return Object.entries(groups).filter(([name]) => name.includes('2026')).slice(0, 12);
  }, [weeks, lang]);

  const getPersonStyles = (name: Person) => {
    const color = customColors?.[name] || 'slate';
    return `bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 border-${color}-200 dark:border-${color}-800/50`;
  };

  const weekLabel = lang === 'it' ? 'Sett.' : 'Wk.';

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {months.map(([monthName, monthWeeks]) => (
        <div key={monthName} className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-widest pl-4 border-l-4 border-indigo-600 dark:border-indigo-400 capitalize">
            {monthName}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {monthWeeks.map((week) => (
              <div key={week.id} className="p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:border-indigo-50 dark:hover:border-indigo-900/30 transition-all group">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                    {weekLabel} {week.id}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {week.startDate.getDate()} {week.startDate.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', {month: 'short'})} - {week.endDate.getDate()} {week.endDate.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { month: 'short' })}
                  </span>
                </div>

                <div className="space-y-3">
                  {AREAS.map(area => {
                    const assignee = week[area.id as keyof Omit<CleaningWeek, 'id' | 'startDate' | 'endDate'>];
                    const isDone = !!progress[week.id]?.[area.id as keyof UserProgress[number]];
                    // @ts-ignore
                    const Icon = LucideIcons[area.iconName] || LucideIcons.HelpCircle;

                    return (
                      <div 
                        key={area.id} 
                        onClick={() => onToggle(week.id, area.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer
                          ${isDone 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 opacity-60' 
                            : 'bg-white dark:bg-slate-900 border-transparent dark:border-white/5 shadow-sm hover:border-indigo-100 dark:hover:border-indigo-500/30'}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={14} className={isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'} />
                          <span className={`text-[11px] font-bold ${isDone ? 'text-emerald-700 dark:text-emerald-300 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                            {lang === 'en' ? area.labelEn : area.label}
                          </span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-transform group-hover:scale-105 ${getPersonStyles(assignee as Person)}`}>
                          {assignee.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MonthlyCalendar;
