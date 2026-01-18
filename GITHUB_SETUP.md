# 🚀 Guida Rapida: Setup GitHub Pages

## Passi da seguire:

### 1. Crea la repository su GitHub
1. Vai su https://github.com/new
2. Nome repository: `FlatMate-Clean` (o un altro nome a tua scelta)
3. **IMPORTANTE**: Lascia vuota la repository (non aggiungere README, .gitignore o licenza)
4. Clicca "Create repository"

### 2. Configura il nome della repository nel progetto
Se hai scelto un nome diverso da `FlatMate-Clean`, aggiorna questi file:

**File: `.github/workflows/deploy.yml`**
- Trova la riga: `VITE_BASE_PATH: /FlatMate-Clean/`
- Sostituisci `FlatMate-Clean` con il nome della tua repository

**File: `vite.config.ts`**
- Trova la riga: `'/FlatMate-Clean/'`
- Sostituisci `FlatMate-Clean` con il nome della tua repository

### 3. Collega il progetto locale a GitHub

```bash
# Aggiungi il remote (sostituisci [TUO-USERNAME] con il tuo username GitHub)
git remote add origin https://github.com/[TUO-USERNAME]/FlatMate-Clean.git

# Rinomina il branch principale in 'main'
git branch -M main

# Aggiungi tutti i file
git add .

# Crea il primo commit
git commit -m "Initial commit: Setup GitHub Pages"

# Invia il codice a GitHub
git push -u origin main
```

### 4. Abilita GitHub Pages
1. Vai nella tua repository su GitHub
2. Clicca su **Settings** (in alto nella repository)
3. Nel menu laterale, clicca su **Pages**
4. Sotto **Source**, seleziona **GitHub Actions**
5. Salva

### 5. Verifica il deploy
1. Vai su **Actions** nella tua repository
2. Dovresti vedere il workflow "Deploy to GitHub Pages" in esecuzione
3. Attendi che completi (circa 2-3 minuti)
4. Una volta completato, vai su **Settings → Pages**
5. Troverai l'URL del tuo sito (es: `https://[TUO-USERNAME].github.io/FlatMate-Clean/`)

## ✅ Fatto!

Il tuo sito sarà disponibile su GitHub Pages e si aggiornerà automaticamente ad ogni push su `main`.

## 🔄 Deploy Futuri

Ogni volta che fai modifiche:
```bash
git add .
git commit -m "Descrizione delle modifiche"
git push
```

Il deploy su GitHub Pages avverrà automaticamente!

