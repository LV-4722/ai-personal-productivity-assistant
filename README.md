# AI Personal Productivity Assistant

An AI-powered personal task manager built for an interview assignment. Users can manage tasks with a standard mobile CRUD interface or with natural-language requests through an AI assistant.

## Features

- Create tasks using natural language
- List tasks using natural language, including completion, date, and priority filters
- Update task details and complete tasks through the assistant
- Traditional mobile task CRUD interface
- Automatic Home-screen refresh on focus, plus manual and pull-to-refresh controls
- Mobile AI chat interface
- PostgreSQL task persistence
- Gemini structured intent extraction

## Architecture

### Mobile

- Expo and React Native
- TypeScript
- Expo Router
- Built-in `fetch`

### Backend

- Node.js and TypeScript
- Express HTTP API
- Gemini provider
- Controller, service, and repository separation

### Database

- PostgreSQL

```text
Mobile
  ↓
POST /assistant
  ↓
Assistant Controller
  ↓
Assistant Service
  ↓
Gemini Provider
  ↓
Intent
  ↓
Task Service
  ↓
Task Repository
  ↓
PostgreSQL
```

## Supported assistant actions

- `CREATE_TASK`
- `LIST_TASKS`
- `UPDATE_TASK`
- `COMPLETE_TASK`

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Backend health check |
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks` | List tasks |
| `GET` | `/tasks/:id` | Get a task by ID |
| `PATCH` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Delete a task |
| `POST` | `/assistant` | Process a natural-language task request |

## Requirements

- Node.js
- PostgreSQL
- Gemini API key
- Expo Go for physical-device testing (optional)

Install dependencies separately for each project:

```bash
cd backend
npm install

cd ../mobile
npm install
```

The task table schema is available in `backend/migrations/001_create_tasks.sql`.

## Environment variables

Create local environment files from the examples and provide values appropriate to your machine.

### Backend (`backend/.env`)

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `APP_TIMEZONE`

### Mobile (`mobile/.env.local`)

- `EXPO_PUBLIC_API_BASE_URL`

Never commit local environment files or API keys.

## Run locally

Start the backend development server:

```bash
cd backend
npm run dev
```

Start Expo:

```bash
cd mobile
npm run start
```

Start the Expo web preview:

```bash
cd mobile
npm run web
```

## Physical Android / LAN setup

For Expo Go on a physical Android device, `localhost` points to the phone—not the development computer. Set `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env.local` to the computer's LAN IP with port `3000`, restart Expo, and ensure:

- The phone and computer are on the same network.
- The backend is running and reachable on port `3000`.
- Windows Firewall permits inbound TCP traffic on port `3000`.

## Example assistant commands

- “Create a high priority task to prepare for my interview tomorrow”
- “Show me my high priority tasks”
- “Move my interview preparation task to Monday at 10 AM”
- “Update my interview preparation task description to revise React Native and AI questions”
- “Mark Submit my resume as completed”

## Engineering decisions

- Gemini returns structured intents instead of free-form actions, keeping task execution predictable.
- Controller, service, and repository layers separate HTTP concerns, business rules, and data access.
- Task-reference matching is deliberately conservative: ambiguous or missing matches do not mutate data.
- Typed contracts are used across backend and mobile API boundaries.
- The mobile API URL is environment-based for local and LAN testing.
- Built-in `fetch` and local component state keep this single-user assignment lightweight without unnecessary dependencies.

## Known limitations

- Single-user assignment; no authentication.
- No `DELETE_TASK` action through the AI assistant.
- No persistent chat history.
- No production deployment configuration.
- AI task-reference matching is intentionally conservative to avoid incorrect task mutation.

## Submission notes

The project was verified through backend API checks, PostgreSQL record verification, and mobile smoke testing.
