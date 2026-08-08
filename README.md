# HostelSaaS 🏠

A production-grade, internship-level Full Stack SaaS for managing hostels, PGs, mess facilities, room allocations, payments, complaints, and student services — with three distinct user roles.

## Tech Stack

| Layer    | Technology                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| Frontend | React 18 (Vite) · TypeScript · React Router DOM · Tailwind CSS v4 · Axios · React Query · Recharts · React Hook Form + Zod |
| Backend  | Node.js · Express · TypeScript · Mongoose (MongoDB) · JWT (access + refresh, HttpOnly cookies) · RBAC                      |
| Monorepo | npm workspaces (`client/`, `server/`, `shared/`) · Husky + lint-staged · GitHub Actions CI                                 |

## User Roles

- **Student** — profile, hostels/rooms, mess (hostel + outside), subscriptions, daily menu, bills, payments, complaints, feedback/ratings, notifications
- **Hostel Admin** — analytics dashboard, students, rooms & allocation, hostel info, hostel mess, complaints kanban, payments, PDF/Excel reports
- **Outside Mess Owner** — mess profile (images, pricing), weekly menu, subscription requests, reviews/ratings, dashboard (subscribers, revenue, rating)

## Repository Structure

```
.
├── client/                 # React (Vite) frontend
│   └── src/
│       ├── components/     # layout, ui, forms, data-display, feedback
│       ├── contexts/       # Auth, Theme
│       ├── hooks/          # reusable hooks
│       ├── lib/            # api client, utils
│       ├── pages/          # student/, admin/, mess-owner/, auth/
│       └── types/          # frontend types
├── server/                 # Express backend
│   └── src/
│       ├── config/         # env config
│       ├── controllers/    # route handlers
│       ├── middleware/     # auth, validation, error handling
│       ├── models/         # Mongoose models (User discriminators, Hostel, Room, Mess, …)
│       ├── routes/         # express routers
│       ├── services/       # business logic
│       ├── utils/          # jwt, asyncHandler, guards
│       └── validators/     # Zod schemas
├── shared/                 # types shared between client & server
└── .github/workflows/      # CI (lint · typecheck · build · prettier)
```

## Getting Started

```bash
# prerequisites: Node 20+, MongoDB running locally
npm install
cp server/.env.example server/.env

# run both workspaces (client :5173 → proxies /api → server :3000)
npm run dev

# individual
npm run dev:client
npm run dev:server
```

## Development Workflow

```bash
npm run lint        # ESLint (all workspaces)
npm run format      # Prettier
npm run typecheck   # tsc --noEmit (per workspace)
npm run build       # production builds
```

**Branching:** feature work happens on branches and lands via **pull requests** — no direct commits to `main`. CI runs on every PR (lint, typecheck, build, formatting) and must pass before merge.

## Roadmap (25 steps / 5 phases)

1. **Setup** — monorepo scaffold & tooling ✅
2. **Backend Core** — auth, models, middleware, validation, error handling
3. **Student Features** — API + flows
4. **Frontend Core** — design system, auth UI, dashboards
5. **Mess Owner** — mess profile, menu, subscriptions
6. **Polish/Deploy** — reports, analytics, deployment

## License

Private / internal project.
