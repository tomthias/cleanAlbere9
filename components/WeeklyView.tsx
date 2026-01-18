import React from 'react';
import * as LucideIcons from 'lucide-react';
import { formatDateRange } from '../services/calendarLogic';
import AreaCard from './AreaCard';
import { CleaningWeek, UserProgress, SwapRequest, Person } from '../types';
import { AREAS } from '../constants';

const { ChevronLeft, ChevronRight, ArrowUpDown, Clock } = LucideIcons;

interface WeeklyViewProps {
    currentViewDataSwapped: CleaningWeek;
    viewIdx: number;
    setViewIdx: React.Dispatch<React.SetStateAction<number>>;
    totalWeeks: number;
    isNow: boolean;
    isPast: boolean;
    lang: 'it' | 'en';
    t: any;
    stats: { completed: number; total: number; percentage: number };
    isSorted: boolean;
    setIsSorted: React.Dispatch<React.SetStateAction<boolean>>;
    sortedAreas: any[];
    progress: UserProgress;
    isActionLocked: boolean;
    onSelectTask: (weekId: number, areaId: string) => void;
    onToggleTask: (weekId: number, areaId: string) => void;
    userColors: Record<Person, string>;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({
    currentViewDataSwapped,
    viewIdx,
    setViewIdx,
    totalWeeks,
    isNow,
    isPast,
    lang,
    t,
    stats,
    isSorted,
    setIsSorted,
    sortedAreas,
    progress,
    isActionLocked,
    onSelectTask,
    onToggleTask,
    userColors
}) => {
    return (
        <div className="flex flex-col gap-8">
            <section className="bg-slate-900 dark:bg-slate-900/50 rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden border dark:border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <button
                            disabled={viewIdx === 0}
                            onClick={() => setViewIdx(v => v - 1)}
                            className="p-3 md:p-4 bg-white/5 hover:bg-white/10 rounded-2xl disabled:opacity-10 transition-all border border-white/10"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="text-center">
                            <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${isNow ? 'bg-indigo-500 border-indigo-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                {t.week.toUpperCase()} {currentViewDataSwapped.id}
                            </div>
                            <h2 className="text-xl md:text-3xl font-black tracking-tighter">{formatDateRange(currentViewDataSwapped.startDate, currentViewDataSwapped.endDate, lang)}</h2>
                        </div>
                        <button
                            disabled={viewIdx === totalWeeks - 1}
                            onClick={() => setViewIdx(v => v + 1)}
                            className="p-3 md:p-4 bg-white/5 hover:bg-white/10 rounded-2xl disabled:opacity-10 transition-all border border-white/10"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.progressTitle}</div>
                            <div className="text-2xl font-black">{Math.round(stats.percentage)}%</div>
                        </div>
                        <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div className={`h-full rounded-full transition-all duration-700 ease-out relative ${stats.percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${stats.percentage}%` }}>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <div className="text-[10px] font-medium text-slate-500">{stats.completed} / {stats.total} {t.areas}</div>
                            <button
                                onClick={() => setIsSorted(!isSorted)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isSorted ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                                <ArrowUpDown size={10} /> {t.sortBy}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAreas.map(area => {
                    const isDone = !!progress[currentViewDataSwapped.id]?.[area.id as keyof UserProgress[number]];
                    return (
                        <div
                            key={area.id}
                            className="relative"
                            onClick={(e) => {
                                if (isActionLocked) return;
                                e.stopPropagation();
                                onSelectTask(currentViewDataSwapped.id, area.id);
                            }}
                        >
                            <AreaCard
                                id={area.id}
                                label={lang === 'en' ? area.labelEn : area.label}
                                iconName={area.iconName}
                                assignee={area.assignee}
                                isDone={isDone}
                                onToggle={() => onToggleTask(currentViewDataSwapped.id, area.id)}
                                isHighlighted={isNow}
                                isOverdue={isPast && !isDone}
                                startDate={currentViewDataSwapped.startDate}
                                endDate={currentViewDataSwapped.endDate}
                                lang={lang}
                                customColor={userColors[area.assignee]}
                            />
                            {area.pendingSwap && (
                                <div className="absolute top-4 right-4 bg-amber-500 text-white p-1.5 rounded-full shadow-lg animate-pulse pointer-events-none">
                                    <Clock size={12} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </section>
        </div>
    );
};

export default WeeklyView;
