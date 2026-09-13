# ⚔️ Life RPG

A **gamified productivity tracker** that turns daily tasks into an RPG adventure. Complete tasks to earn XP, level up your character, upgrade kingdom buildings, maintain streaks, tackle daily quests, and collaborate in guilds.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Language | TypeScript |

---

## Getting Started

### 1. Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Google AI Studio](https://aistudio.google.com) account (for Gemini API key)

### 2. Install dependencies
```bash
cd life-rpg
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env.local
# Fill in your Supabase URL, keys, and Gemini API key
```

### 4. Run database migrations

Open your **Supabase SQL Editor** (Dashboard → SQL Editor) and run each file in order:

```
supabase/migrations/00001_create_profiles.sql
supabase/migrations/00002_create_tasks.sql
supabase/migrations/00003_create_character.sql
supabase/migrations/00004_create_buildings.sql
supabase/migrations/00005_create_streaks.sql
supabase/migrations/00006_create_daily_quests.sql
supabase/migrations/00007_create_guilds.sql
```

> **Tip:** If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) and a linked project:
> ```bash
> supabase db push
> ```

### 5. Start the dev server
```bash
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
life-rpg/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar shell
│   │   ├── tasks/page.tsx
│   │   ├── character/page.tsx
│   │   ├── buildings/page.tsx
│   │   ├── quests/page.tsx     # Daily quests
│   │   └── guild/page.tsx
│   ├── api/health/route.ts     # GET /api/health
│   ├── layout.tsx
│   └── page.tsx               # Redirects → /login
├── lib/supabase/
│   ├── client.ts              # Browser client
│   ├── server.ts              # Server/RSC client
│   └── proxy.ts               # Session refresh util
├── types/
│   └── database.types.ts      # Full typed DB schema
├── supabase/migrations/       # 7 ordered SQL migrations
├── proxy.ts                   # Next.js 16 auth proxy
└── .env.example
```

---

## Database Schema

### `profiles` — extends `auth.users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, FK → auth.users |
| email | TEXT | |
| created_at | TIMESTAMPTZ | |

### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → profiles |
| category | TEXT | e.g. `fitness`, `study` |
| title | TEXT | |
| status | TEXT | `pending` \| `completed` \| `failed` |
| created_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | Nullable |

### `character` — one per user
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | PK |
| level | INT | Starts at 1 |
| xp | INT | Current XP |
| attributes | JSONB | `{strength, intelligence, endurance, creativity}` |

### `buildings` — one per type per user
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → profiles |
| type | TEXT | `gym` \| `library` \| `office` \| `studio` |
| level | INT | |
| current_xp | INT | |
| xp_required_next | INT | |
| status | TEXT | `idle` \| `upgrading` |
| upgrade_started_at | TIMESTAMPTZ | Nullable |
| upgrade_complete_at | TIMESTAMPTZ | Nullable |
| streak_bonus_active | BOOLEAN | |

### `streaks` — composite PK `(user_id, category)`
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID | |
| category | TEXT | |
| current_streak | INT | |
| last_completed_date | DATE | Nullable |
| freeze_available | BOOLEAN | Streak freeze shield |

### `daily_quests`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → profiles |
| task_template | TEXT | Quest description template |
| assigned_date | DATE | |
| status | TEXT | `pending` \| `completed` \| `expired` |
| bonus_xp | INT | XP reward on completion |

### `guilds`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | TEXT | |
| join_code | TEXT | Unique invite code |
| created_by | UUID | FK → profiles |
| created_at | TIMESTAMPTZ | |

### `guild_members` — composite PK `(guild_id, user_id)`
| Column | Type | Notes |
|--------|------|-------|
| guild_id | UUID | FK → guilds |
| user_id | UUID | FK → profiles |
| joined_at | TIMESTAMPTZ | |

---

## Auth & Routing

| Route | Access |
|-------|--------|
| `/login`, `/register` | Public only (redirect to `/tasks` if logged in) |
| `/tasks`, `/character`, `/buildings`, `/quests`, `/guild` | Auth required |

Session management runs in `proxy.ts` (Next.js 16's replacement for `middleware.ts`).

---

## Generating TypeScript Types

After schema changes:
```bash
npx supabase gen types typescript --project-id <your-project-id> > types/database.types.ts
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server → http://localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
