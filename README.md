# 🎓 Zenith Study Hub

A student productivity platform for managing academic life — featuring calendar management, project tracking, focus sessions, and course organization.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

### 📅 Smart Calendar
- Create and manage academic events (assignments, exams, readings)
- Color-coded by course
- Date range filtering and quick event creation

### 📚 Course Management
- Add and organize courses with custom color coding
- Track meeting days, times, and locations

### 📋 Project Tracker
- Track group projects and assignments with task breakdowns
- Progress monitoring, due dates, and status tracking (active, completed, archived)

### 🎯 Focus Mode
- Pomodoro-style focus sessions tied to courses
- Session history, study time tracking, and weekly productivity stats

### 📄 Syllabus Parser *(To Be Implemented)*
- Upload PDF syllabi for automatic event extraction and bulk calendar import

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/zenith-study-hub.git
cd zenith-study-hub/frontend
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the `frontend/` directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these in your Supabase project under **Settings → API**.

### 3. Set up the database

Run the migration files in order against your Supabase project (via the SQL editor or `psql`):

```
database/migrations/001_create_users.sql
database/migrations/002_create_courses.sql
database/migrations/003_create_calendar_events.sql
database/migrations/004_create_projects.sql
database/migrations/005_create_focus_sessions.sql
```

### 4. Run locally

```bash
cd frontend
npm run dev
```

App will be available at http://localhost:3000

---

## 📁 Project Structure

```
zenith-study-hub/
├── frontend/                   # Next.js 14 application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # Supabase client, queries, utilities
│   │   └── store/             # Zustand auth store
│   └── package.json
│
├── database/
│   └── migrations/            # SQL migration files
│
└── backend/                   # Legacy Express server (not used in production)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth & Database | Supabase (PostgreSQL + Auth + Realtime) |
| Data fetching | TanStack Query v5 |
| State management | Zustand |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |

### Architecture notes
- The frontend communicates **directly with Supabase** — no separate backend server is required.
- **Realtime** updates are enabled via Supabase Postgres Changes, which automatically invalidates the TanStack Query cache across open tabs.
- Auth supports **email/password** and **Google OAuth** via Supabase Auth.

---

## 🔒 Security

- Row-Level Security (RLS) on all Supabase tables ensures users can only access their own data.
- Auth state is managed via Supabase's built-in session handling with auto token refresh.
- The anon key is safe to expose client-side — RLS policies are the access control layer.

---

## 🚢 Deployment

The frontend can be deployed to **Vercel** in one step:

1. Push to GitHub
2. Import the project on [vercel.com](https://vercel.com) pointing to the `frontend/` directory
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

For Google OAuth, add your Vercel deployment URL to the **Redirect URLs** list in Supabase under **Authentication → URL Configuration**.

---

## 📝 Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase project anon/public key |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — see the LICENSE file for details.

