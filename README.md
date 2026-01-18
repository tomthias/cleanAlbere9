<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FlatMate Clean - Calendario Pulizie

Applicazione web per la gestione del calendario delle pulizie condiviso tra coinquilini.

## 🚀 Demo Live

L'applicazione è disponibile su GitHub Pages: [Visualizza Demo](https://tomthias.github.io/claean-albere9/)

## 📋 Prerequisiti

- Node.js (versione 18 o superiore)
- npm o yarn

## 🛠️ Installazione e Setup Locale

1. **Clona la repository:**
   ```bash
   git clone https://github.com/tomthias/claean-albere9.git
   cd claean-albere9
   ```

2. **Installa le dipendenze:**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente:**
   Crea un file `.env.local` nella root del progetto e aggiungi:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Avvia il server di sviluppo:**
   ```bash
   npm run dev
   ```

   L'applicazione sarà disponibile su `http://localhost:3000`

## 📦 Build per Produzione

```bash
npm run build
```

I file compilati saranno nella cartella `dist/`.

## 🌐 Deploy su GitHub Pages

Il progetto è già configurato per il deploy automatico su GitHub Pages tramite GitHub Actions.

### Setup Iniziale

Il progetto è già configurato per la repository [claean-albere9](https://github.com/tomthias/claean-albere9).

**Collega la repository locale a GitHub:**
```bash
git remote add origin https://github.com/tomthias/claean-albere9.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

4. **Abilita GitHub Pages:**
   - Vai su Settings → Pages nella tua repository GitHub
   - Sotto "Source", seleziona "GitHub Actions"
   - Il workflow si attiverà automaticamente ad ogni push su `main`

### Deploy Automatico

Ogni volta che fai push su `main`, GitHub Actions:
1. Esegue il build dell'applicazione
2. Deploy automatico su GitHub Pages

Puoi anche attivare manualmente il deploy andando su Actions → Deploy to GitHub Pages → Run workflow.

## 📝 Note

- Repository GitHub: [tomthias/claean-albere9](https://github.com/tomthias/claean-albere9)
- GitHub Pages URL: https://tomthias.github.io/claean-albere9/
- Le variabili d'ambiente sensibili (come `GEMINI_API_KEY`) non devono essere committate nel repository

## 🛠️ Tecnologie Utilizzate

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React Icons

## 📄 Licenza

Questo progetto è privato.
