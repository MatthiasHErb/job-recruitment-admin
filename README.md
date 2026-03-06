# Recruitment Admin

Admin-Dashboard für die Bewertung von Bewerbungen. Nutzt dieselbe Supabase-Instanz wie die Job-Application-Site.

**Vollständige Doku für beide Apps:** `../JOB-APPLICATION-RECRUITMENT-DOCS.md` (Anpassung für neue Stellen, Setup, Deployment)

## Features

- **Authentifizierung** – Nur eingeloggte Nutzer haben Zugriff
- **PDF-Liste** – Alle Bewerbungen aus dem Storage
- **AI-Analyse** – OpenAI oder Infomaniak analysiert CVs (Name, Position, E-Mail, Stärken, Schwächen, Ranking)
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
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.2

# only for AI_PROVIDER=infomaniak
INFOMANIAK_API_KEY=ik-...
INFOMANIAK_PRODUCT_ID=12345
INFOMANIAK_MODEL=qwen3
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

## Zwei Instanzen parallel betreiben

Empfohlen: gleiches Repo, zwei Deployments mit unterschiedlichen Environment Variables.

- **Instanz 1 (OpenAI):**
  - `AI_PROVIDER=openai`
  - `OPENAI_API_KEY=...`
  - optional `OPENAI_MODEL=...`
- **Instanz 2 (Infomaniak / qwen3):**
  - `AI_PROVIDER=infomaniak`
  - `INFOMANIAK_API_KEY=...`
  - `INFOMANIAK_PRODUCT_ID=...`
  - optional `INFOMANIAK_MODEL=qwen3`

Beide Instanzen koennen dieselben Supabase-Tabellen nutzen. Bei einer erneuten Analyse derselben Bewerbung gilt weiterhin last-write-wins.
