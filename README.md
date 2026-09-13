# ⚔️ Life RPG

> **Turn your daily grind into an epic adventure.**

A **gamified productivity platform** that transforms everyday tasks into an RPG experience. Complete tasks to earn XP, level up your character, upgrade kingdom buildings, maintain streaks, tackle AI-powered daily quests, and collaborate in guilds — all to build better habits, one quest at a time.

### 🌐 [Live Demo →](https://life-k47j6c428-sloth49.vercel.app)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗡️ **Task Management** | Create, start, and complete tasks across categories — fitness, study, work, and creativity |
| 🧙 **Character Progression** | Earn XP, level up, and grow four attributes: Strength, Intelligence, Endurance, Creativity |
| 🏰 **Kingdom Buildings** | Upgrade Gym, Library, Office, and Studio buildings as you progress in each category |
| 🔥 **Streak System** | Track daily consistency per category with streak freeze shields to protect your progress |
| 📜 **AI Daily Quests** | Fresh challenges generated every day by Google Gemini AI to keep things interesting |
| ⚔️ **Guilds & Leaderboard** | Create or join guilds with invite codes and compete on the leaderboard |
| 🔐 **Secure Auth** | Email/password authentication powered by Supabase Auth |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router) |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Google Gemini API |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Language | TypeScript |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Google AI Studio](https://aistudio.google.com) account (for Gemini API key)

### 1. Clone & Install

```bash
git clone https://github.com/Yash49-Xe/Life-RPG.git
cd Life-RPG
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in the following in `.env.local`:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (keep secret!) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |

### 3. Run Database Migrations

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

### 4. Start the Dev Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
life-rpg/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login screen
│   │   └── register/page.tsx       # Registration screen
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Game shell sidebar
│   │   ├── tasks/page.tsx          # Task management
│   │   ├── character/page.tsx      # Character stats & leveling
│   │   ├── buildings/page.tsx      # Kingdom buildings
│   │   ├── quests/page.tsx         # AI-powered daily quests
│   │   └── guild/page.tsx          # Guilds & leaderboard
│   ├── api/                        # REST API routes
│   ├── actions/                    # Server actions (auth)
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Entry redirect
├── components/                     # Reusable UI components
├── lib/                            # Supabase clients & utilities
├── types/                          # TypeScript type definitions
├── supabase/migrations/            # 7 ordered SQL migrations
├── proxy.ts                        # Next.js 16 auth proxy
└── .env.example                    # Environment variable template
```

---

## 🗄️ Database Schema

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

## 🔐 Auth & Routing

| Route | Access |
|-------|--------|
| `/login`, `/register` | Public only (redirect to `/tasks` if logged in) |
| `/tasks`, `/character`, `/buildings`, `/quests`, `/guild` | Auth required |

Session management runs in `proxy.ts` (Next.js 16's replacement for `middleware.ts`).

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server → http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

---

## 🌍 Deployment

This project is deployed on **Vercel** with automatic deployments on every push to `main`.

**Live URL:** [life-k47j6c428-sloth49.vercel.app](https://life-k47j6c428-sloth49.vercel.app)

To deploy your own:
1. Fork this repo
2. Import into [Vercel](https://vercel.com)
3. Add the environment variables (see above)
4. Deploy!

---

## 📄 License

This project was built for the **IIT BH Hackathon**.
