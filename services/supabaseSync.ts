import { supabase } from '../lib/supabase'
import { UserProgress, Person } from '../types'

/**
 * Aggiorna lo stato di un singolo task (Atomico)
 */
export const updateTaskStatus = async (
  weekId: number,
  areaId: string,
  isCompleted: boolean,
  completedBy: Person
): Promise<void> => {
  if (!supabase) return;

  console.log(`📡 Sincronizzazione task: ${areaId} (Settimana ${weekId}) -> ${isCompleted ? 'Fatto' : 'Da fare'} da ${completedBy}`);

  try {
    if (isCompleted) {
      const { data, error } = await supabase
        .from('cleaning_progress')
        .upsert({
          week_id: weekId,
          area_id: areaId,
          completed_by: completedBy,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'week_id,area_id'
        })
        .select();

      if (error) {
        console.error('❌ Errore upsert progress:', error);
        throw error;
      }
      console.log('✅ Upsert completato:', data);
    } else {
      const { error } = await supabase
        .from('cleaning_progress')
        .delete()
        .eq('week_id', weekId)
        .eq('area_id', areaId);

      if (error) {
        console.error('❌ Errore delete progress:', error);
        throw error;
      }
      console.log('✅ Delete completato');
    }
  } catch (error) {
    console.error('❌ Fallimento critico sincronizzazione:', error);
    throw error;
  }
};

/**
 * Carica tutto il progresso
 */
export const loadProgressFromSupabase = async (): Promise<UserProgress | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('cleaning_progress')
      .select('week_id, area_id')

    if (error) {
      console.error('❌ Errore loadProgressFromSupabase:', error);
      return null;
    }

    // Converti in formato UserProgress
    const progress: UserProgress = {};

    data?.forEach((item) => {
      if (!progress[item.week_id]) {
        progress[item.week_id] = {};
      }
      progress[item.week_id][item.area_id as keyof UserProgress[number]] = true;
    });

    console.log(`📦 Caricati ${data?.length || 0} task completati da Supabase`);
    return progress;
  } catch (error) {
    console.error('❌ Errore critico loadProgressFromSupabase:', error);
    return null;
  }
};

/**
 * Gestione Preferenze
 */
export const syncPreferencesToSupabase = async (
  userName: Person,
  colors: Record<Person, string>,
  theme: 'light' | 'dark',
  language: 'it' | 'en'
): Promise<void> => {
  if (!supabase) return

  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_name: userName,
        color_preference: colors,
        theme_preference: theme,
        language_preference: language,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_name'
      })

    if (error) throw error
  } catch (error) {
    console.error('❌ Errore syncPreferencesToSupabase:', error)
  }
}

export const loadPreferencesFromSupabase = async (
  userName: Person
): Promise<{ colors: Record<Person, string>, theme: 'light' | 'dark', language: 'it' | 'en' } | null> => {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_name', userName)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') { // Ignora "Riga non trovata"
        console.error('❌ Errore loadPreferencesFromSupabase:', error)
      }
      return null
    }

    return {
      colors: data.color_preference as Record<Person, string>,
      theme: data.theme_preference as 'light' | 'dark',
      language: data.language_preference as 'it' | 'en'
    }
  } catch (error) {
    console.error('❌ Errore loadPreferencesFromSupabase:', error)
    return null
  }
}

/**
 * Real-time Subscription
 */
export const subscribeToProgressUpdates = (
  onUpdate: () => void
): (() => void) => {
  if (!supabase) return () => { }

  const subscription = supabase
    .channel('public:cleaning_progress')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cleaning_progress' },
      () => {
        console.log('🔄 Rilevato cambiamento in real-time')
        onUpdate()
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

