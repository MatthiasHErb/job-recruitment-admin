# Recruitment Admin

Admin-Dashboard für die Bewertung von Post-Doc-Bewerbungen (Plant Volatile Interactions). Nutzt dieselbe Supabase-Instanz wie die Job-Application-Site.

## Features

- **Authentifizierung** – Nur eingeloggte Nutzer haben Zugriff
- **PDF-Liste** – Alle Bewerbungen aus dem Storage
- **AI-Analyse** – OpenAI analysiert CVs (Name, Position, E-Mail, Stärken, Schwächen, Ranking)
- **Tabelle** – Sortierbar nach Ranking oder Name
- **PDF-Link** – Signierte URLs zum Anschauen
- **E-Mail** – Direktlink für Kontaktaufnahme

## Setup

### 1. Supabase (gleiches Projekt wie job-application-erb)

1. **Tabellen anlegen** – `supabase/candidates.sql` im SQL Editor ausführen (enthält recruitment_candidates, recruitment_settings, archived_applications)
2. **Nutzer anlegen** – In Supabase Auth einen Admin-Account erstellen (Email + Passwort)

### 2. Umgebungsvariablen

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
```

### 3. Lokal starten

```bash
npm install
npm run dev
```

→ http://localhost:3001

## Deployment (Vercel)

1. Neues Projekt mit diesem Repo verbinden
2. Environment Variables setzen (siehe oben)
3. Deploy
