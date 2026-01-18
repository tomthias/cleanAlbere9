import React, { useState, useMemo } from 'react';
import { isCurrentWeek } from './services/calendarLogic';
import { AREAS, PEOPLE } from './constants';
import AreaCard, { areaSubTasks } from './components/AreaCard';
import MonthlyCalendar from './components/MonthlyCalendar';
import WeeklyView from './components/WeeklyView';
import { CleaningWeek, UserProgress, Person } from './types';
import { UserProvider, useUser } from './components/UserContext';
import UserSelector from './components/UserSelector';
import SyncStatus from './components/SyncStatus';
import ProfileEditor from './components/ProfileEditor';
import * as LucideIcons from 'lucide-react';
import { useCleaningData } from './hooks/useCleaningData';
import { createSwapRequest, acceptSwapRequest, cancelSwapRequest } from './services/swapService';

const {
  ChevronDown,
  Sun,
  Moon,
  UserCircle,
  LayoutGrid,
  Columns,
  Languages,
  Settings,
  X,
  Palette,
  CheckCircle2,
  CalendarPlus,
  Info,
  Check,
  ArrowLeftRight,
  Clock,
  MapPin
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
    profile: "Profilo",
    requestSwap: "Richiedi Cambio",
    cancelSwap: "Annulla Richiesta",
    acceptSwap: "Accetta Cambio",
    pendingSwap: "Richiesta in sospeso",
    swappedWith: "Sostituito da"
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
    profile: "Profile",
    requestSwap: "Request Swap",
    cancelSwap: "Cancel Request",
    acceptSwap: "Accept Swap",
    pendingSwap: "Pending request",
    swappedWith: "Replaced by"
  }
};

const MainContent: React.FC = () => {
  const { currentUser } = useUser();
  const {
    lang, setLang,
    theme, setTheme,
    weeks, activeWeeks,
    progress,
    swaps,
    userColors, setUserColors,
    isSyncing, lastSynced,
    userAvatar, setUserAvatar,
    userDisplayName, setUserDisplayName,
    toggleTask,
    isOnline
  } = useCleaningData(currentUser);

  const t = translations[lang];

  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [isSorted, setIsSorted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ weekId: number, areaId: string } | null>(null);
  const [subTaskProgress, setSubTaskProgress] = useState<Record<string, boolean>>({});
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isActionLocked, setIsActionLocked] = useState(false);

  const currentWeekIndex = useMemo(() => {
    const now = new Date();
    const idx = weeks.findIndex(w => now >= w.startDate && now <= w.endDate);
    return idx === -1 ? 0 : idx;
  }, [weeks]);

  const [viewIdx, setViewIdx] = useState(currentWeekIndex);

  const closeModal = () => {
    setSelectedTask(null);
    setIsActionLocked(true);
    setTimeout(() => setIsActionLocked(false), 350);
  };

  const currentViewDataSwapped = activeWeeks[viewIdx];
  const isNow = isCurrentWeek(currentViewDataSwapped.startDate, currentViewDataSwapped.endDate);
  const isPast = new Date() > currentViewDataSwapped.endDate;

  const sortedAreas = useMemo(() => {
    const areasWithAssignees = AREAS.map(area => ({
      ...area,
      assignee: currentViewDataSwapped[area.id as keyof Omit<CleaningWeek, 'id' | 'startDate' | 'endDate'>],
      pendingSwap: swaps.find(s => s.week_id === currentViewDataSwapped.id && s.area_id === area.id && s.status === 'pending')
    }));

    if (isSorted) {
      return [...areasWithAssignees].sort((a, b) => a.assignee.localeCompare(b.assignee));
    }
    return areasWithAssignees;
  }, [currentViewDataSwapped, isSorted, swaps]);

  const stats = useMemo(() => {
    const weekProgress = progress[currentViewDataSwapped.id] || {};
    const completed = Object.values(weekProgress).filter(Boolean).length;
    const total = AREAS.length;
    return { completed, total, percentage: (completed / total) * 100 };
  }, [progress, currentViewDataSwapped]);

  const activeTaskData = useMemo(() => {
    if (!selectedTask) return null;
    const week = activeWeeks.find(w => w.id === selectedTask.weekId);
    const area = AREAS.find(a => a.id === selectedTask.areaId);
    if (!week || !area) return null;
    const assignee = week[area.id as keyof Omit<CleaningWeek, 'id' | 'startDate' | 'endDate'>] as Person;
    const isDone = !!progress[week.id]?.[area.id as keyof UserProgress[number]];
    const pendingSwap = swaps.find(s => s.week_id === week.id && s.area_id === area.id && s.status === 'pending');
    return { week, area, assignee, isDone, pendingSwap };
  }, [selectedTask, activeWeeks, progress, swaps]);

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

  const colorOptions = ['blue', 'rose', 'emerald', 'violet', 'orange', 'amber', 'cyan', 'fuchsia', 'slate'];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 pb-32 relative">
      <UserSelector />
      <SyncStatus isSyncing={isSyncing} isOnline={isOnline} lastSyncedAt={lastSynced} />
      <ProfileEditor
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onUpdate={(name, avatar) => {
          setUserDisplayName(name);
          setUserAvatar(avatar);
        }}
      />

      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-[900] text-slate-900 dark:text-white tracking-tight leading-none">
            FlatMate <span className="text-indigo-600 dark:text-indigo-400">Albere 9</span>
          </h1>
          {currentUser && (
            <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <span>Ciao, {userDisplayName || currentUser}</span>
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
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 touch-manipulation"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => setShowSettings(true)} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 touch-manipulation">
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
        <WeeklyView
          currentViewDataSwapped={currentViewDataSwapped}
          viewIdx={viewIdx}
          setViewIdx={setViewIdx}
          totalWeeks={weeks.length}
          isNow={isNow}
          isPast={isPast}
          lang={lang}
          t={t}
          stats={stats}
          isSorted={isSorted}
          setIsSorted={setIsSorted}
          sortedAreas={sortedAreas}
          progress={progress}
          isActionLocked={isActionLocked}
          onSelectTask={(weekId, areaId) => {
            setSubTaskProgress({});
            setIsAccordionOpen(false);
            setSelectedTask({ weekId, areaId });
          }}
          onToggleTask={toggleTask}
          userColors={userColors}
        />
      ) : (
        <MonthlyCalendar
          weeks={activeWeeks}
          progress={progress}
          onToggle={toggleTask}
          lang={lang}
          customColors={userColors}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && activeTaskData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden touch-none" onClick={(e) => { e.stopPropagation(); closeModal(); }}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-slate-950/80"></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border dark:border-white/10" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="p-8 pb-0 md:p-12 md:pb-0 flex-shrink-0">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-5 rounded-[1.8rem] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm`}>
                  {/* @ts-ignore */}
                  {React.createElement(LucideIcons[activeTaskData.area.iconName] || Info, { size: 40, strokeWidth: 2.5 })}
                </div>
                <button onClick={(e) => { e.stopPropagation(); closeModal(); }} className="p-3 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
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
                {activeTaskData.pendingSwap && (
                  <div className="mt-2 flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest">
                    <Clock size={14} />
                    {t.pendingSwap}
                  </div>
                )}
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
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubTaskProgress(prev => ({ ...prev, [idx]: !prev[idx] }));
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group hover:bg-white dark:hover:bg-slate-800 ${subTaskProgress[idx] ? 'bg-white/50 dark:bg-slate-800/50' : ''}`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${subTaskProgress[idx] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700 text-transparent group-hover:border-indigo-400'}`}>
                          <Check size={14} strokeWidth={4} />
                        </div>
                        <span className={`text-[13px] font-bold ${subTaskProgress[idx] ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                          {subTask}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-8 md:p-12 pt-4 flex-shrink-0 space-y-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTask(activeTaskData.week.id, activeTaskData.area.id);
                  closeModal();
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

              {/* Swap Button */}
              {currentUser && (
                <div className="mt-6 border-t dark:border-white/5 pt-6">
                  {!activeTaskData.pendingSwap ? (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`${t.requestSwap}?`)) {
                          await createSwapRequest(activeTaskData.week.id, activeTaskData.area.id, activeTaskData.assignee);
                          closeModal();
                        }
                      }}
                      className="w-full py-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/30 text-indigo-500 font-black text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all"
                    >
                      <ArrowLeftRight size={16} />
                      {t.requestSwap.toUpperCase()}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {activeTaskData.pendingSwap.original_person === currentUser ? (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await cancelSwapRequest(activeTaskData.pendingSwap!.id);
                            closeModal();
                          }}
                          className="w-full py-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 font-black text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all"
                        >
                          <X size={16} />
                          {t.cancelSwap.toUpperCase()}
                        </button>
                      ) : (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`${t.acceptSwap}?`)) {
                              await acceptSwapRequest(activeTaskData.pendingSwap!.id, currentUser as Person);
                              closeModal();
                            }
                          }}
                          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-[11px] tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                        >
                          <Check size={16} />
                          {t.acceptSwap.toUpperCase()}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 touch-none" onClick={(e) => { e.stopPropagation(); setShowSettings(false); setIsActionLocked(true); setTimeout(() => setIsActionLocked(false), 350); }}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl"><Palette size={20} /></div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.settings}</h2>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowSettings(false); setIsActionLocked(true); setTimeout(() => setIsActionLocked(false), 350); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                {PEOPLE.map(person => (
                  <div key={person} className="space-y-3">
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">{person}</div>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          onClick={() => setUserColors(prev => {
                            const next = { ...prev, [person]: color };
                            return next;
                          })}
                          className={`w-10 h-10 rounded-full border-4 transition-all active:scale-90 touch-manipulation ${userColors[person] === color ? 'border-indigo-600 dark:border-indigo-400 scale-110' : 'border-white dark:border-slate-800 hover:scale-105 shadow-sm'}`}
                          style={{ backgroundColor: `var(--tw-color-${color}-500, ${color === 'emerald' ? '#10b981' : color === 'violet' ? '#8b5cf6' : color === 'rose' ? '#f43f5e' : color})` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={(e) => { e.stopPropagation(); setShowSettings(false); setIsActionLocked(true); setTimeout(() => setIsActionLocked(false), 350); }} className="w-full mt-10 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none">{t.save.toUpperCase()}</button>
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
