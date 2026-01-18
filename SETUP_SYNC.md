# 🔄 Setup Sincronizzazione Multi-Dispositivo

## ✅ Cosa è stato implementato

- ✅ Client Supabase configurato (`lib/supabase.ts`)
- ✅ Servizio sincronizzazione (`services/supabaseSync.ts`)
- ✅ Integrazione in App.tsx con real-time
- ✅ Fallback a localStorage se Supabase non è configurato

## 🚀 Setup Rapido (5 minuti)

### 1. Crea Progetto Supabase

1. Vai su https://supabase.com e crea account (gratuito)
2. Clicca **"New Project"**
3. Compila:
   - **Name:** `flatmate-clean` (o qualsiasi nome)
   - **Database Password:** (salva questa password!)
   - **Region:** Scegli la più vicina
4. Attendi 2-3 minuti per il provisioning

### 2. Crea Tabelle Database

Nel dashboard Supabase, vai su **SQL Editor** e incolla questo script:

```sql
-- Tabella per il progresso delle pulizie
CREATE TABLE IF NOT EXISTS cleaning_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id INTEGER NOT NULL,
  area_id TEXT NOT NULL,
  completed_by TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(week_id, area_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_cleaning_progress_week_id ON cleaning_progress(week_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_progress_area_id ON cleaning_progress(area_id);

-- Tabella per le preferenze utente
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT UNIQUE NOT NULL,
  color_preference JSONB DEFAULT '{}'::jsonb,
  theme_preference TEXT DEFAULT 'light',
  language_preference TEXT DEFAULT 'it',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita Row Level Security (per ora pubblico, in futuro con auth)
ALTER TABLE cleaning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti possono leggere e scrivere (per ora)
CREATE POLICY "Allow public read access" ON cleaning_progress FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON cleaning_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON cleaning_progress FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON cleaning_progress FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON user_preferences FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON user_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON user_preferences FOR UPDATE USING (true);
```

Clicca **"Run"** per eseguire lo script.

### 3. Configura Variabili d'Ambiente

1. Copia il file di esempio:
   ```bash
   cp .env.local.example .env.local
   ```

2. Ottieni le chiavi Supabase:
   - Vai su **Settings** → **API** nel dashboard Supabase
   - Copia **"Project URL"** → `VITE_SUPABASE_URL`
   - Copia **"anon/public key"** → `VITE_SUPABASE_ANON_KEY`

3. Modifica `.env.local` con le tue chiavi:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. Abilita Real-time (Importante!)

Nel dashboard Supabase:
1. Vai su **Database** → **Replication**
2. Trova la tabella `cleaning_progress`
3. Attiva il toggle **"Enable Realtime"**
4. Salva

### 5. Testa l'Applicazione

```bash
npm run dev
```

Apri l'app su due browser diversi:
- Completa una pulizia su un browser
- Dovrebbe apparire automaticamente sull'altro (real-time) ✨

## 🔍 Verifica Funzionamento

1. **Controlla Console Browser:**
   - Dovresti vedere log di sincronizzazione
   - Se vedi "📦 Supabase non disponibile", controlla `.env.local`

2. **Controlla Supabase Dashboard:**
   - Vai su **Table Editor** → `cleaning_progress`
   - Dovresti vedere i dati quando completi una pulizia

3. **Test Multi-Dispositivo:**
   - Apri l'app su telefono e computer
   - Completa una pulizia su uno
   - Dovrebbe sincronizzarsi automaticamente sull'altro

## 🛠️ Troubleshooting

### "Supabase non disponibile" nella console
- ✅ Verifica che `.env.local` esista e contenga le chiavi corrette
- ✅ Riavvia il dev server dopo aver modificato `.env.local`
- ✅ Controlla che non ci siano spazi extra nelle variabili

### Real-time non funziona
- ✅ Verifica che Realtime sia abilitato in Database → Replication
- ✅ Controlla la console del browser per errori
- ✅ Assicurati che entrambi i browser siano sulla stessa pagina

### Dati non si sincronizzano
- ✅ Controlla la tabella `cleaning_progress` in Supabase
- ✅ Verifica che le RLS policies siano attive
- ✅ Controlla i log in Database → Logs

## 📊 Come Funziona

1. **Al caricamento:** L'app carica i dati da Supabase (se disponibile)
2. **Al completamento:** Quando completi una pulizia, viene sincronizzata su Supabase
3. **Real-time:** Gli altri dispositivi ricevono aggiornamenti automatici via WebSocket
4. **Fallback:** Se Supabase non è configurato, usa localStorage come prima

## ✅ Checklist

- [ ] Progetto Supabase creato
- [ ] Tabelle create con SQL script
- [ ] Realtime abilitato su `cleaning_progress`
- [ ] `.env.local` configurato con le chiavi
- [ ] Dev server riavviato
- [ ] Testato su due browser diversi
- [ ] Verificato sincronizzazione real-time

## 🎉 Fatto!

Ora la tua app sincronizza automaticamente tra tutti i dispositivi! 🚀
