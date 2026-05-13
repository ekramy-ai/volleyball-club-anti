# ⚡ XURA SYSTEM
### Professional Volleyball Club Management & Scout Analysis Platform

![XURA Banner](https://img.shields.io/badge/XURA-System-red?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5-purple?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge)

---

## 📋 Overview

XURA System is a world-class volleyball club management and scout analysis platform built for:

- 🏐 Professional volleyball clubs
- 🎯 Coaches and analysts
- 📡 Live match scouting
- 🤖 AI-powered coaching assistance
- 📊 Real-time performance analytics

---

## 🚀 Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | React + Vite + Tailwind CSS   |
| Database    | Supabase (PostgreSQL)         |
| Auth        | Supabase Auth                 |
| Storage     | Supabase Storage              |
| AI          | OpenAI / Gemini API           |
| Routing     | React Router DOM v6           |

---

## ⚙️ Setup

### 1. Clone

```bash
git clone https://github.com/ekramy-ai/volleyball-club-anti.git
cd volleyball-club-anti
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-key
VITE_GEMINI_API_KEY=your-gemini-key
```

### 4. Setup Database

Open your [Supabase SQL Editor](https://supabase.com/dashboard) and run:

```
supabase/schema.sql
```

This creates all tables, indexes, RLS policies, and triggers.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
xura-system/
├── xura-system.jsx          # Main app entry (routing, sidebar, layout)
├── index.html               # HTML entry point
├── src/
│   ├── index.css            # Global Tailwind styles
│   └── lib/
│       ├── supabase.js      # Supabase client singleton
│       └── db.js            # All DB helper functions
├── features/
│   ├── dashboard/           # Dashboard module
│   ├── teams/               # Teams management
│   ├── players/             # Player profiles
│   ├── matches/             # Match scheduling
│   ├── scouting/            # Live scouting engine
│   ├── video/               # Video analysis
│   ├── analytics/           # Performance analytics
│   ├── training/            # Training management
│   ├── ai/                  # AI Coach Assistant
│   ├── reports/             # PDF reports
│   └── settings/            # System settings
├── supabase/
│   └── schema.sql           # Complete DB schema
├── locales/
│   ├── en/translation.json  # English translations
│   └── ar/translation.json  # Arabic translations
└── .env.example             # Environment template
```

---

## 🗄️ Database Tables

| Table              | Description                          |
|--------------------|--------------------------------------|
| `clubs`            | Club profiles and branding           |
| `seasons`          | Season management                    |
| `teams`            | Team rosters per season              |
| `players`          | Full player profiles + metrics       |
| `opponents`        | Opponent team database               |
| `matches`          | Match scheduling and results         |
| `scouting_events`  | Real-time scouting event log         |
| `training_sessions`| Training session management          |
| `attendance`       | Player attendance tracking           |
| `injuries`         | Injury and recovery tracking         |
| `videos`           | Video library with timestamps        |
| `profiles`         | User profiles (extends Supabase Auth)|

---

## 🔐 Roles

| Role                | Permissions                            |
|---------------------|----------------------------------------|
| `super_admin`       | Full platform control                  |
| `club_manager`      | Club and team management               |
| `head_coach`        | Tactics, training, analytics           |
| `assistant_coach`   | Scouting and training support          |
| `scout_analyst`     | Match event coding                     |
| `physiotherapist`   | Injuries and fitness                   |
| `strength_coach`    | Physical development tracking          |
| `player`            | View own stats and schedule            |
| `media_manager`     | Videos and multimedia                  |

---

## 📄 License

MIT © XURA System 2026
