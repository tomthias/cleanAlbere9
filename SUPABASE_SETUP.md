# 🚀 Setup Supabase per FlatMate Clean

## 📋 Prerequisiti

1. Account Supabase (gratuito): https://supabase.com
2. Node.js installato
3. Progetto FlatMate Clean configurato

---

## 🔧 Step 1: Creare Progetto Supabase

1. Vai su https://supabase.com e crea un account
2. Clicca "New Project"
3. Compila:
   - **Name:** `flatmate-clean`
   - **Database Password:** (salva questa password!)
   - **Region:** Scegli la più vicina (es. `West Europe`)
4. Attendi il provisioning (2-3 minuti)

---

## 🗄️ Step 2: Creare Tabelle Database

Vai su **SQL Editor** nel dashboard Supabase e esegui questo script:

```sql
-- ============================================
-- TABELLA: cleaning_progress
-- Traccia lo stato di completamento delle pulizie
-- ============================================
CREATE TABLE IF NOT EXISTS cleaning_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id INTEGER NOT NULL,
  area_id TEXT NOT NULL,
  completed_by TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(week_id, area_id) -- Una pulizia per settimana/area
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_cleaning_progress_week_id ON cleaning_progress(week_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_progress_area_id ON cleaning_progress(area_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_progress_completed_by ON cleaning_progress(completed_by);

-- ============================================
-- TABELLA: user_preferences
-- Preferenze utente (colori, tema, lingua)
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  color_preference JSONB DEFAULT '{}'::jsonb, -- { "Mattia": "blue", "Martina": "rose", ... }
  theme_preference TEXT DEFAULT 'light', -- 'light' | 'dark'
  language_preference TEXT DEFAULT 'it', -- 'it' | 'en'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELLA: week_notes
-- Commenti e note per settimane/aree
-- ============================================
CREATE TABLE IF NOT EXISTS week_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id INTEGER NOT NULL,
  area_id TEXT, -- NULL = nota generale alla settimana
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT, -- Link a Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_week_notes_week_id ON week_notes(week_id);
CREATE INDEX IF NOT EXISTS idx_week_notes_area_id ON week_notes(area_id);

-- ============================================
-- TABELLA: rotation_config
-- Configurazione rotazioni (per feature futura)
-- ============================================
CREATE TABLE IF NOT EXISTS rotation_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area_id TEXT NOT NULL,
  rotation_sequence TEXT[] NOT NULL, -- Array di nomi: ['Mattia', 'Martina', ...]
  start_week_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Sicurezza: tutti possono leggere, solo autenticati possono scrivere
-- ============================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE cleaning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_config ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti possono leggere (per ora, senza autenticazione)
CREATE POLICY "Allow public read access" ON cleaning_progress
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON user_preferences
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON week_notes
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON rotation_config
  FOR SELECT USING (true);

-- Policy: Tutti possono inserire/aggiornare (per ora, senza autenticazione)
-- In futuro, sostituire con autenticazione
CREATE POLICY "Allow public insert" ON cleaning_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON cleaning_progress
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert" ON user_preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON user_preferences
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert" ON week_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON week_notes
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON week_notes
  FOR DELETE USING (true);
```

---

## 📦 Step 3: Installare Supabase Client

Nel progetto FlatMate Clean:

```bash
npm install @supabase/supabase-js
```

---

## 🔑 Step 4: Configurare Variabili d'Ambiente

Crea/modifica `.env.local`:

```env
VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
VITE_SUPABASE_ANON_KEY=la-tua-anon-key
```

**Dove trovare le chiavi:**
1. Vai su **Settings** → **API** nel dashboard Supabase
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

---

## 💻 Step 5: Creare Client Supabase

Crea `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipi TypeScript per le tabelle
export interface CleaningProgress {
  id: string
  week_id: number
  area_id: string
  completed_by: string
  completed_at: string
  created_at: string
}

export interface UserPreferences {
  id: string
  user_name: string
  color_preference: Record<string, string>
  theme_preference: 'light' | 'dark'
  language_preference: 'it' | 'en'
  updated_at: string
}

export interface WeekNote {
  id: string
  week_id: number
  area_id: string | null
  author: string
  content: string
  image_url: string | null
  created_at: string
  updated_at: string
}
```

---

## 🔄 Step 6: Servizio per Sincronizzazione

Crea `services/supabaseSync.ts`:

```typescript
import { supabase, CleaningProgress, UserPreferences } from '../lib/supabase'
import { UserProgress, Person } from '../types'

/**
 * Sincronizza il progresso delle pulizie con Supabase
 */
export const syncProgressToSupabase = async (
  progress: UserProgress,
  completedBy: Person
): Promise<void> => {
  try {
    // Per ogni settimana e area completata
    for (const [weekIdStr, weekProgress] of Object.entries(progress)) {
      const weekId = parseInt(weekIdStr)
      
      for (const [areaId, isCompleted] of Object.entries(weekProgress)) {
        if (isCompleted) {
          // Upsert: inserisci o aggiorna
          const { error } = await supabase
            .from('cleaning_progress')
            .upsert({
              week_id: weekId,
              area_id: areaId,
              completed_by: completedBy,
              completed_at: new Date().toISOString()
            }, {
              onConflict: 'week_id,area_id'
            })
          
          if (error) {
            console.error('Error syncing progress:', error)
          }
        } else {
          // Rimuovi se non completato
          const { error } = await supabase
            .from('cleaning_progress')
            .delete()
            .eq('week_id', weekId)
            .eq('area_id', areaId)
          
          if (error) {
            console.error('Error removing progress:', error)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in syncProgressToSupabase:', error)
    throw error
  }
}

/**
 * Carica il progresso da Supabase
 */
export const loadProgressFromSupabase = async (): Promise<UserProgress> => {
  try {
    const { data, error } = await supabase
      .from('cleaning_progress')
      .select('week_id, area_id')
      .order('week_id', { ascending: true })
    
    if (error) {
      console.error('Error loading progress:', error)
      return {}
    }
    
    // Converti in formato UserProgress
    const progress: UserProgress = {}
    
    data?.forEach((item) => {
      if (!progress[item.week_id]) {
        progress[item.week_id] = {}
      }
      progress[item.week_id][item.area_id as keyof UserProgress[number]] = true
    })
    
    return progress
  } catch (error) {
    console.error('Error in loadProgressFromSupabase:', error)
    return {}
  }
}

/**
 * Sincronizza le preferenze utente
 */
export const syncPreferencesToSupabase = async (
  userName: Person,
  colors: Record<Person, string>,
  theme: 'light' | 'dark',
  language: 'it' | 'en'
): Promise<void> => {
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
    
    if (error) {
      console.error('Error syncing preferences:', error)
    }
  } catch (error) {
    console.error('Error in syncPreferencesToSupabase:', error)
  }
}

/**
 * Carica le preferenze da Supabase
 */
export const loadPreferencesFromSupabase = async (
  userName: Person
): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_name', userName)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Nessun record trovato
        return null
      }
      console.error('Error loading preferences:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in loadPreferencesFromSupabase:', error)
    return null
  }
}

/**
 * Sottoscrizione real-time per aggiornamenti progresso
 */
export const subscribeToProgressUpdates = (
  callback: (progress: UserProgress) => void
) => {
  const subscription = supabase
    .channel('cleaning_progress_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'cleaning_progress'
      },
      async () => {
        // Ricarica tutto il progresso quando cambia qualcosa
        const updatedProgress = await loadProgressFromSupabase()
        callback(updatedProgress)
      }
    )
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}
```

---

## 🔄 Step 7: Integrare in App.tsx

Modifica `App.tsx` per usare Supabase:

```typescript
// Aggiungi import
import { 
  syncProgressToSupabase, 
  loadProgressFromSupabase,
  syncPreferencesToSupabase,
  subscribeToProgressUpdates 
} from './services/supabaseSync'

// Nel componente App, aggiungi:
useEffect(() => {
  // Carica progresso da Supabase al mount
  loadProgressFromSupabase().then((supabaseProgress) => {
    if (Object.keys(supabaseProgress).length > 0) {
      setProgress(supabaseProgress)
    }
  })
  
  // Sottoscrivi a aggiornamenti real-time
  const unsubscribe = subscribeToProgressUpdates((updatedProgress) => {
    setProgress(updatedProgress)
  })
  
  return () => {
    unsubscribe()
  }
}, [])

// Modifica toggleTask per sincronizzare
const toggleTask = async (weekId: number, areaId: string) => {
  const newProgress = {
    ...progress,
    [weekId]: {
      ...(progress[weekId] || {}),
      [areaId]: !progress[weekId]?.[areaId as keyof UserProgress[number]]
    }
  }
  
  setProgress(newProgress)
  
  // Sincronizza con Supabase
  const assignee = currentViewData[areaId as keyof Omit<CleaningWeek, 'id' | 'startDate' | 'endDate'>] as Person
  await syncProgressToSupabase(newProgress, assignee)
}

// Sincronizza preferenze quando cambiano
useEffect(() => {
  // Determina l'utente corrente (per ora usa il primo, in futuro da auth)
  const currentUser: Person = 'Mattia' // TODO: da autenticazione
  
  syncPreferencesToSupabase(
    currentUser,
    userColors,
    theme,
    lang
  )
}, [userColors, theme, lang])
```

---

## 🧪 Step 8: Test

1. **Test Locale:**
   ```bash
   npm run dev
   ```

2. **Verifica Supabase:**
   - Vai su **Table Editor** nel dashboard
   - Dovresti vedere i dati quando completi una pulizia

3. **Test Multi-Dispositivo:**
   - Apri l'app su due browser diversi
   - Completa una pulizia su uno
   - Dovrebbe apparire automaticamente sull'altro (real-time)

---

## 🚨 Troubleshooting

### Errore: "Missing Supabase environment variables"
- Verifica che `.env.local` esista e contenga le variabili
- Riavvia il dev server dopo aver aggiunto le variabili

### Errore: "relation does not exist"
- Verifica di aver eseguito lo script SQL nel SQL Editor
- Controlla che le tabelle esistano in **Table Editor**

### Real-time non funziona
- Verifica che le subscription siano attive in **Database** → **Replication**
- Controlla la console del browser per errori

---

## 📊 Monitoraggio

Nel dashboard Supabase puoi vedere:
- **Database** → **Tables**: Dati inseriti
- **Database** → **Logs**: Query eseguite
- **Realtime** → **Channels**: Subscription attive

---

## 🔒 Sicurezza Futura

Quando implementi autenticazione:

1. **Modifica RLS policies:**
```sql
-- Solo utenti autenticati possono scrivere
CREATE POLICY "Authenticated users can write" ON cleaning_progress
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update" ON cleaning_progress
  FOR UPDATE USING (auth.role() = 'authenticated');
```

2. **Aggiungi autenticazione:**
```typescript
import { supabase } from './lib/supabase'

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

---

## ✅ Checklist Implementazione

- [ ] Progetto Supabase creato
- [ ] Tabelle create con SQL script
- [ ] RLS policies configurate
- [ ] Variabili d'ambiente configurate
- [ ] Client Supabase installato e configurato
- [ ] Servizio sync creato
- [ ] Integrato in App.tsx
- [ ] Testato localmente
- [ ] Testato multi-dispositivo
- [ ] Real-time funzionante

---

Una volta completato questo setup, avrai la sincronizzazione multi-dispositivo funzionante! 🎉
