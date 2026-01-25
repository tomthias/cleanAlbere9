import { useState, useEffect, useMemo, useRef } from 'react';
import { generateCalendar } from '../services/calendarLogic';
import { UserProgress, Person, CleaningWeek, SwapRequest } from '../types';
import {
    updateTaskStatus,
    loadProgressFromSupabase,
    syncPreferencesToSupabase,
    subscribeToProgressUpdates,
    subscribeToPreferenceUpdates,
    loadPreferencesFromSupabase,
    loadAllUsersProfiles,
    UserProfile
} from '../services/supabaseSync';
import {
    loadSwaps,
    subscribeToSwapUpdates
} from '../services/swapService';

const defaultColors: Record<Person, string> = {
    Mattia: 'blue',
    Martina: 'rose',
    Shapa: 'emerald',
    Mariana: 'violet'
};

export const useCleaningData = (currentUser: Person | null) => {
    const [lang, setLang] = useState<'it' | 'en'>('it');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('flatmate_theme');
        if (saved) return saved as 'light' | 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const weeks = useMemo(() => generateCalendar(), []);
    const [swaps, setSwaps] = useState<SwapRequest[]>([]);
    const [userColors, setUserColors] = useState<Record<Person, string>>(() => {
        const saved = localStorage.getItem('flatmate_colors');
        return saved ? JSON.parse(saved) : defaultColors;
    });

    const [progress, setProgress] = useState<UserProgress>(() => {
        const saved = localStorage.getItem('cleaning_progress_v2');
        return saved ? JSON.parse(saved) : {};
    });

    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);
    const [userAvatar, setUserAvatar] = useState<string>('👤');
    const [userDisplayName, setUserDisplayName] = useState<string>('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [allUsersProfiles, setAllUsersProfiles] = useState<Record<Person, UserProfile>>({
        Mattia: { avatar: '👤', displayName: 'Mattia' },
        Martina: { avatar: '👤', displayName: 'Martina' },
        Shapa: { avatar: '👤', displayName: 'Shapa' },
        Mariana: { avatar: '👤', displayName: 'Mariana' }
    });

    const isInitialLoading = useRef(true);

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

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setIsSyncing(true);
            isInitialLoading.current = true;
            try {
                const supabaseProgress = await loadProgressFromSupabase();
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
                        if (prefs.displayName) setUserDisplayName(prefs.displayName);
                        if (prefs.avatarUrl) setUserAvatar(prefs.avatarUrl);
                    }
                }

                const activeSwaps = await loadSwaps();
                setSwaps(activeSwaps);

                // Load all users profiles for display in cards
                const profiles = await loadAllUsersProfiles();
                setAllUsersProfiles(profiles);

                setLastSynced(new Date());
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsSyncing(false);
                setTimeout(() => { isInitialLoading.current = false; }, 100);
            }
        };
        loadData();
    }, [currentUser]);

    // Subscriptions
    useEffect(() => {
        const unsubSwaps = subscribeToSwapUpdates(() => {
            loadSwaps().then(setSwaps);
        });
        const unsubProgress = subscribeToProgressUpdates(() => {
            loadProgressFromSupabase().then(p => {
                if (p !== null) {
                    setProgress(p);
                    localStorage.setItem('cleaning_progress_v2', JSON.stringify(p));
                    setLastSynced(new Date());
                }
            });
        });
        return () => {
            unsubSwaps();
            unsubProgress();
        };
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        return subscribeToPreferenceUpdates(currentUser, () => {
            loadPreferencesFromSupabase(currentUser).then(prefs => {
                if (prefs) {
                    setUserColors(prefs.colors);
                    setTheme(prefs.theme);
                    setLang(prefs.language);
                    if (prefs.displayName) setUserDisplayName(prefs.displayName);
                    if (prefs.avatarUrl) setUserAvatar(prefs.avatarUrl);
                }
            });
        });
    }, [currentUser]);

    // Sync preferences
    useEffect(() => {
        if (!currentUser || isInitialLoading.current) return;
        localStorage.setItem('flatmate_colors', JSON.stringify(userColors));
        localStorage.setItem('flatmate_theme', theme);

        const syncTimeout = setTimeout(() => {
            syncPreferencesToSupabase(currentUser, userColors, theme, lang, userDisplayName, userAvatar)
                .then(() => setLastSynced(new Date()))
                .catch(err => console.error("Sync failed:", err));
        }, 1000);
        return () => clearTimeout(syncTimeout);
    }, [userColors, theme, lang, currentUser, userDisplayName, userAvatar]);

    // Computed data - applica gli swap accettati alle settimane
    const activeWeeks = useMemo(() => {
        return weeks.map(week => {
            const weekSwaps = swaps.filter(s => s.week_id === week.id && s.status === 'accepted');
            const newWeek = { ...week };
            weekSwaps.forEach(swap => {
                if (swap.swapped_with) {
                    (newWeek as any)[swap.area_id] = swap.swapped_with;
                }
            });
            return newWeek;
        });
    }, [weeks, swaps]);

    const toggleTask = async (weekId: number, areaId: string) => {
        if (!currentUser) return;

        // Salva stato precedente per revert
        const previousProgress = progress;

        const isCompleted = !progress[weekId]?.[areaId as keyof UserProgress[number]];
        const newProgress = {
            ...progress,
            [weekId]: { ...(progress[weekId] || {}), [areaId]: isCompleted }
        };

        // Optimistic update
        setProgress(newProgress);
        localStorage.setItem('cleaning_progress_v2', JSON.stringify(newProgress));
        setIsSyncing(true);

        try {
            await updateTaskStatus(weekId, areaId, isCompleted, currentUser);
            setLastSynced(new Date());
        } catch (error) {
            console.error('Task toggle sync failed, reverting:', error);
            // Revert su errore
            setProgress(previousProgress);
            localStorage.setItem('cleaning_progress_v2', JSON.stringify(previousProgress));
        } finally {
            setIsSyncing(false);
        }
    };

    // Funzione per ricaricare gli swaps manualmente
    const refreshSwaps = async () => {
        try {
            const activeSwaps = await loadSwaps();
            setSwaps(activeSwaps);
        } catch (error) {
            console.error('Error refreshing swaps:', error);
        }
    };

    return {
        lang, setLang,
        theme, setTheme,
        weeks, activeWeeks,
        progress, setProgress,
        swaps, setSwaps,
        userColors, setUserColors,
        isSyncing, lastSynced,
        userAvatar, setUserAvatar,
        userDisplayName, setUserDisplayName,
        allUsersProfiles,
        toggleTask,
        isOnline,
        refreshSwaps
    };
};
