

import React, { useState, useEffect, useMemo } from 'react';
import { generateCalendar, isCurrentWeek, formatDateRange } from './services/calendarLogic';
import { AREAS, PEOPLE } from './constants';
import AreaCard, { areaSubTasks } from './components/AreaCard';
import MonthlyCalendar from './components/MonthlyCalendar';
import { CleaningWeek, UserProgress, Person } from './types';
import {
  updateTaskStatus,
  loadProgressFromSupabase,
  syncPreferencesToSupabase,
  subscribeToProgressUpdates,
  loadPreferencesFromSupabase
} from './services/supabaseSync';
import { UserProvider, useUser } from './components/UserContext';
import UserSelector from './components/UserSelector';
import SyncStatus from './components/SyncStatus';
import ProfileEditor from './components/ProfileEditor';
import * as LucideIcons from 'lucide-react';
import { supabase } from './lib/supabase';

const {
  ChevronLeft,
  ChevronRight,
  MapPin,
  LayoutGrid,
  Columns,
  Languages,
  ArrowUpDown,
  Settings,
  X,
  Palette,
  CheckCircle2,
  CalendarPlus,
  Info,
  Check,
  ChevronDown,
  Sun,
  Moon,
  UserCircle
} = LucideIcons;

const translations = {
  it: {
    week: "Settimana",
    month: "Mese",
    progressTitle: "Completamento Pulizie",
    areas: "aree",
    focus: "FOCUS OGGI",
    sortBy: "Ordina per responsabile",
    settings: "Personalizza Colori",
    save: "Salva",
    close: "Chiudi",
    whatToDo: "Lista attività",
    markDone: "Segna come fatto",
    markUndone: "Ripristina turno",
    responsible: "Responsabile",
    addToCalendar: "Aggiungi al calendario",
    showTasks: "Mostra dettagli",
    hideTasks: "Nascondi dettagli",
    profile: "Profilo"
  },
  en: {
    week: "Week",
    month: "Month",
    progressTitle: "Cleaning Progress",
    areas: "areas",
    focus: "FOCUS TODAY",
    sortBy: "Sort by assignee",
    settings: "Customize Colors",
    save: "Save",
    close: "Close",
    whatToDo: "Task list",
    markDone: "Mark as done",
    markUndone: "Reset task",
    responsible: "Assignee",
    addToCalendar: "Add to Calendar",
    showTasks: "Show details",
    hideTasks: "Hide details",
    profile: "Profile"
  }
};

const defaultColors: Record<Person, string> = {
  Mattia: 'blue',
  Martina: 'rose',
  Shapa: 'emerald',
  Mariana: 'violet'
};

const MainContent: React.FC = () => {
  const { currentUser } = useUser();
  const [lang, setLang] = useState<'it' | 'en'>('it');
  const t = translations[lang];

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('flatmate_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const weeks = useMemo(() => generateCalendar(), []);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [isSorted, setIsSorted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ weekId: number, areaId: string } | null>(null);
  const [subTaskProgress, setSubTaskProgress] = useState<Record<string, boolean>>({});
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const [userColors, setUserColors] = useState<Record<Person, string>>(() => {
    const saved = localStorage.getItem('flatmate_colors');
    return saved ? JSON.parse(saved) : defaultColors;
  });

  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('cleaning_progress_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const currentWeekIndex = useMemo(() => {
    const now = new Date();
    const idx = weeks.findIndex(w => now >= w.startDate && now <= w.endDate);
    return idx === -1 ? 0 : idx;
  }, [weeks]);

  const [viewIdx, setViewIdx] = useState(currentWeekIndex);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [userAvatar, setUserAvatar] = useState<string>('👤');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carica progresso da Supabase al mount
  useEffect(() => {
    const loadData = async () => {
      setIsSyncing(true);
      console.log('🔄 Avvio caricamento dati per:', currentUser);
      try {
        const supabaseProgress = await loadProgressFromSupabase();
        console.log('📦 Dati ricevuto da Supabase:', supabaseProgress);

        if (supabaseProgress !== null) {
          setProgress(supabaseProgress);
          localStorage.setItem('cleaning_progress_v2', JSON.stringify(supabaseProgress));
        }

        if (currentUser) {
          const prefs = await loadPreferencesFromSupabase(currentUser);
          if (prefs) {
            setUserColors(prefs.colors);
            setTheme(prefs.theme);
            setLang(prefs.language);
          }

          if (supabase) {
            const { data, error } = await supabase
              .from('user_preferences')
              .select('avatar_url')
              .eq('user_name', currentUser)
              .maybeSingle();

            if (error) console.error('❌ Errore caricamento avatar:', error);
            if (data?.avatar_url) setUserAvatar(data.avatar_url);
          }
        }
        setLastSynced(new Date());
      } catch (error) {
        console.error('Errore caricamento:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Sottoscrizione real-time
  useEffect(() => {
    const unsubscribe = subscribeToProgressUpdates(() => {
      console.log('🔔 Aggiornamento real-time ricevuto!');
      loadProgressFromSupabase().then(updatedProgress => {
        if (updatedProgress !== null) {
          console.log('📥 Progresso aggiornato via real-time:', updatedProgress);
          setProgress(updatedProgress);
          localStorage.setItem('cleaning_progress_v2', JSON.stringify(updatedProgress));
          setLastSynced(new Date());
        }
      });
    });
    return () => unsubscribe();
  }, []);

  // Sincronizza preferenze
  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem('flatmate_colors', JSON.stringify(userColors));
    localStorage.setItem('flatmate_theme', theme);

    syncPreferencesToSupabase(currentUser, userColors, theme, lang);
  }, [userColors, theme, lang, currentUser]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleToggleTask = async (weekId: number, areaId: string) => {
    if (!currentUser) return;

    // Optimistic update
    const isCompleted = !progress[weekId]?.[areaId as keyof UserProgress[number]];
    const newProgress = {
      ...progress,
      [weekId]: {
        ...(progress[weekId] || {}),
        [areaId]: isCompleted
      }
    };

    setProgress(newProgress);
    setIsSyncing(true);

    try {
      await updateTaskStatus(weekId, areaId, isCompleted, currentUser);
      setLastSynced(new Date());
    } catch (error) {
      console.error('Initial sync failed, reverting...', error);
      // Revert on failure could be implemented here
    } finally {
      setIsSyncing(false);
    }
  };

  const currentViewData = weeks[viewIdx];
  const isNow = isCurrentWeek(currentViewData.startDate, currentViewData.endDate);
  const isPast = new Date() > currentViewData.endDate;

  const sortedAreas = useMemo(() => {
    const areasWithAssignees = AREAS.map(area => ({
      ...area,
      assignee: currentViewData[area.id as keyof Omit<CleaningWeek, 'id' | 'startDate' | 'endDate'>]
    }));

    if (isSorted) {
      return [...areasWithAssignees].sort((a, b) => a.assignee.localeCompare(b.assignee));
    }
    return areasWithAssignees;
  }, [currentViewData, isSorted]);

  const stats = useMemo(() => {
    const weekProgress = progress[currentViewData.id] || {};
    const completed = Object.values(weekProgress).filter(Boolean).length;
    const total = AREAS.length;
    return { completed, total, percentage: (completed / total) * 100 };
  }, [progress, currentViewData]);

  const colorOptions = ['blue', 'rose', 'emerald', 'violet', 'orange', 'amber', 'cyan', 'fuchsia', 'slate'];

  const activeTaskData = useMemo(() => {
    if (!selectedTask) return null;
    const week = weeks.find(w => w.id === selectedTask.weekId);
    const area = AREAS.find(a => a.id === selectedTask.areaId);
    if (!week || !area) return null;
    const assignee = week[area.id as keyof Omit<CleaningWeek, 'id' | 'startDate' | 'endDate'>] as Person;
    const isDone = !!progress[week.id]?.[area.id as keyof UserProgress[number]];
    return { week, area, assignee, isDone };
  }, [selectedTask, weeks, progress]);

  const handleAddToCalendar = () => {
    if (!activeTaskData) return;
    const { area, assignee, week } = activeTaskData;
    const tasks = areaSubTasks[area.id]?.[lang] || [];
    const fmtDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const title = encodeURIComponent(`Pulizia ${lang === 'it' ? area.label : area.labelEn}: ${assignee}`);
    const details = encodeURIComponent(`Attività:\n- ${tasks.join('\n- ')}\n\nFlatMate Albere 9`);
    const dates = `${fmtDate(week.startDate)}/${fmtDate(week.endDate)}`;
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&sf=true&output=xml`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 pb-32 relative">
      <UserSelector />
      <SyncStatus isSyncing={isSyncing} isOnline={isOnline} lastSyncedAt={lastSynced} />
      <ProfileEditor isOpen={showProfile} onClose={() => setShowProfile(false)} />

      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-[900] text-slate-900 dark:text-white tracking-tight leading-none">
            FlatMate <span className="text-indigo-600 dark:text-indigo-400">Albere 9</span>
          </h1>
          {currentUser && (
            <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <span>Ciao, {currentUser}</span>
              <button onClick={() => setShowProfile(true)} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                {userAvatar !== '👤' ? userAvatar : <UserCircle size={14} />}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowProfile(true)} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all md:hidden">
            <UserCircle size={18} />
          </button>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => setShowSettings(true)} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
            <Settings size={18} />
          </button>
          <button onClick={() => setLang(l => l === 'it' ? 'en' : 'it')} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-2">
            <Languages size={16} />
            <span className="text-[10px] font-black uppercase">{lang}</span>
          </button>
          <div className="bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
            <button onClick={() => setViewMode('weekly')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${viewMode === 'weekly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>
              <LayoutGrid size={12} /> {t.week}
            </button>
            <button onClick={() => setViewMode('monthly')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${viewMode === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>
              <Columns size={12} /> {t.month}
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'weekly' ? (
        <div className="flex flex-col gap-8">
          <section className="bg-slate-900 dark:bg-slate-900/50 rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden border dark:border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <button disabled={viewIdx === 0} onClick={() => setViewIdx(v => v - 1)} className="p-3 md:p-4 bg-white/5 hover:bg-white/10 rounded-2xl disabled:opacity-10 transition-all border border-white/10">
                  <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                  <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-3 ${isNow ? 'bg-indigo-500 border-indigo-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                    {t.week.toUpperCase()} {currentViewData.id}
                  </div>
                  <h2 className="text-xl md:text-3xl font-black tracking-tighter">{formatDateRange(currentViewData.startDate, currentViewData.endDate, lang)}</h2>
                </div>
                <button disabled={viewIdx === weeks.length - 1} onClick={() => setViewIdx(v => v + 1)} className="p-3 md:p-4 bg-white/5 hover:bg-white/10 rounded-2xl disabled:opacity-10 transition-all border border-white/10">
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
                  <button onClick={() => setIsSorted(!isSorted)} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isSorted ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                    <ArrowUpDown size={10} /> {t.sortBy}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAreas.map(area => {
              const isDone = !!progress[currentViewData.id]?.[area.id as keyof UserProgress[number]];
              return (
                <div key={area.id} onClick={() => {
                  setSubTaskProgress({});
                  setIsAccordionOpen(false);
                  setSelectedTask({ weekId: currentViewData.id, areaId: area.id });
                }}>
                  <AreaCard
                    id={area.id}
                    label={lang === 'en' ? area.labelEn : area.label}
                    iconName={area.iconName}
                    assignee={area.assignee}
                    isDone={isDone}
                    onToggle={() => { }}
                    isHighlighted={isNow}
                    isOverdue={isPast && !isDone}
                    startDate={currentViewData.startDate}
                    endDate={currentViewData.endDate}
                    lang={lang}
                    customColor={userColors[area.assignee]}
                  />
                </div>
              );
            })}
          </section>
        </div>
      ) : (
        <MonthlyCalendar weeks={weeks} progress={progress} onToggle={handleToggleTask} lang={lang} customColors={userColors} />
      )}

      {/* Task Detail Modal */}
      {selectedTask && activeTaskData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-slate-950/80" onClick={() => setSelectedTask(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border dark:border-white/10">

            {/* Modal Header */}
            <div className="p-8 pb-0 md:p-12 md:pb-0 flex-shrink-0">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-5 rounded-[1.8rem] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm`}>
                  {/* @ts-ignore */}
                  {React.createElement(LucideIcons[activeTaskData.area.iconName] || Info, { size: 40, strokeWidth: 2.5 })}
                </div>
                <button onClick={() => setSelectedTask(null)} className="p-3 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-400 mb-2">
                  {lang === 'en' ? activeTaskData.area.labelEn : activeTaskData.area.label}
                </h2>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {activeTaskData.assignee}
                </h3>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 md:px-12 py-4 custom-scrollbar">
              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] border border-slate-100 dark:border-white/5 overflow-hidden">
                {/* Accordion Header */}
                <button
                  onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                  className="w-full flex items-center justify-between p-6 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Info size={16} className="text-indigo-400" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">{t.whatToDo}</span>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-slate-400 dark:text-slate-600 transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Accordion Content */}
                <div className={`transition-all duration-300 ease-in-out ${isAccordionOpen ? 'max-h-96 opacity-100 pb-6 px-6' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="space-y-1.5 pt-2">
                    {(areaSubTasks[activeTaskData.area.id]?.[lang] || []).map((subTask, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group hover:bg-white dark:hover:bg-slate-800 ${subTaskProgress[idx] ? 'bg-white/50 dark:bg-slate-800/50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={!!subTaskProgress[idx]}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSubTaskProgress(prev => ({ ...prev, [idx]: !prev[idx] }));
                          }}
                        />
                        <div className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${subTaskProgress[idx] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700 text-transparent group-hover:border-indigo-400'}`}>
                          <Check size={14} strokeWidth={4} />
                        </div>
                        <span className={`text-[13px] font-bold ${subTaskProgress[idx] ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                          {subTask}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-8 md:p-12 pt-4 flex-shrink-0 space-y-4">
              <button
                onClick={() => {
                  handleToggleTask(activeTaskData.week.id, activeTaskData.area.id);
                  setSelectedTask(null);
                }}
                className={`w-full py-5 rounded-[1.8rem] font-black text-sm tracking-widest flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${activeTaskData.isDone ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-500 text-white shadow-emerald-200 dark:shadow-none'}`}
              >
                <CheckCircle2 size={20} />
                {(activeTaskData.isDone ? t.markUndone : t.markDone).toUpperCase()}
              </button>

              <button
                onClick={handleAddToCalendar}
                className="w-full py-5 rounded-[1.8rem] border-2 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-black text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all"
              >
                <CalendarPlus size={18} />
                {t.addToCalendar.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-white/10">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl"><Palette size={20} /></div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.settings}</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                {PEOPLE.map(person => (
                  <div key={person} className="space-y-3">
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">{person}</div>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          onClick={() => setUserColors(prev => ({ ...prev, [person]: color }))}
                          className={`w-8 h-8 rounded-full border-4 transition-all ${userColors[person] === color ? 'border-indigo-600 dark:border-indigo-400 scale-110' : 'border-white dark:border-slate-800 hover:scale-105 shadow-sm'}`}
                          style={{ backgroundColor: `var(--tw-color-${color}-500, ${color === 'emerald' ? '#10b981' : color === 'violet' ? '#8b5cf6' : color === 'rose' ? '#f43f5e' : color})` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-10 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none">{t.save.toUpperCase()}</button>
            </div>
          </div>
        </div>
      )}

      {!isNow && (
        <button onClick={() => { setViewIdx(currentWeekIndex); setViewMode('weekly'); }} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-5 rounded-full shadow-2xl font-black flex items-center gap-3 hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all hover:scale-105 active:scale-95 z-50 border-[4px] border-white dark:border-slate-800 text-xs tracking-widest">
          <MapPin size={18} /> {t.focus}
        </button>
      )}

      <footer className="mt-16 text-center">
        <p className="text-slate-400 dark:text-slate-700 text-[9px] uppercase tracking-[0.4em] font-black opacity-30">FlatMate Albere 9 &bull; 2026</p>
      </footer>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s infinite ease-in-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        :root {
          --tw-color-blue-500: #3b82f6; --tw-color-rose-500: #f43f5e; --tw-color-emerald-500: #10b981;
          --tw-color-violet-500: #8b5cf6; --tw-color-orange-500: #f97316; --tw-color-amber-500: #f59e0b;
          --tw-color-cyan-500: #06b6d4; --tw-color-fuchsia-500: #d946ef; --tw-color-slate-500: #64748b;
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <MainContent />
    </UserProvider>
  );
};

export default App;
