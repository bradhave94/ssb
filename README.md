# Super Simple Budget (SSB)

A zero-based envelope budgeting app. **Stupid simple** for members to add expenses—powerful enough for admins to manage the full budget.

## Features

- **Envelope budgeting** — Assign every dollar to a category at the start of each month
- **Admin / Member roles** — Members add expenses only; admins manage budgets, income, and approvals
- **Running account balances** — Matches real bank accounts; only cleared transactions affect balances
- **Pending workflow** — Member transactions start pending; admin clears/approves them
- **Transfers** — Move money between accounts (checking ↔ credit card) as paired transactions
- **Recurring transactions** — Income and expenses on a schedule (daily, weekly, monthly, etc.)
- **Overspending allowed** — Envelopes can go negative; cover overspending by moving money between envelopes
- **Archive instead of delete** — Soft-delete envelopes and accounts; keep history intact

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start (React, SSR, file-based routing) |
| Database | SQLite / Turso (libSQL) + Drizzle ORM |
| Auth | Better Auth (email/password, roles) |
| UI | shadcn/ui (Vega preset), Tailwind CSS v4, Lucide icons |
| Forms | TanStack Form + Zod |
| State | TanStack Query |
| Package manager | Bun |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)

### Install

```bash
bun install
```

### Development

```bash
bun run dev
```

Runs at [http://localhost:3000](http://localhost:3000).

### Build

```bash
bun run build
```

### Preview production build

```bash
bun run preview
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `file:./data.db` (local) or `libsql://...turso.io` (production) |
| `DATABASE_AUTH_TOKEN` | Turso auth token (production only) |
| `BETTER_AUTH_SECRET` | Random string for Better Auth |
| `BETTER_AUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `RESEND_API_KEY` | Resend API key for emails |
| `EMAIL_FROM` | Verified sender email |

## Project Structure

```
src/
├── components/     # React components
│   └── ui/         # shadcn/ui components
├── lib/             # Utilities
├── routes/          # TanStack Router pages
└── styles.css       # Global styles
```

## Development

### Adding shadcn components

Use the shadcn CLI to add components. They are installed into `src/components/ui/`:

```bash
bunx --bun shadcn@latest add button
bunx --bun shadcn@latest add dialog
bunx --bun shadcn@latest add table
```

To add multiple at once:

```bash
bunx --bun shadcn@latest add dialog sheet tabs
```

Browse components at [ui.shadcn.com](https://ui.shadcn.com). Import with path aliases:

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
```

### Path aliases

| Alias | Path |
|-------|------|
| `@/components` | `src/components` |
| `@/components/ui` | `src/components/ui` |
| `@/lib` | `src/lib` |
| `@/hooks` | `src/hooks` |

### Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (port 3000) |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |
| `bun run test` | Run Vitest tests |
| `bun run lint` | Run ESLint |
| `bun run format` | Run Prettier |
| `bun run check` | Format + lint fix |

## Roles

| Role | Can do |
|------|--------|
| **Admin** | Full control: budgets, envelopes, income, recurring, clear transactions, accounts |
| **Member** | Add expense transactions only (always pending); view balances and envelopes |

## Deployment

Designed for **Vercel** + **Turso**:

- Run `drizzle-kit` migrations before deploy
- Set env vars in Vercel dashboard
- Local dev uses file-based SQLite (`file:./data.db`)

## License

Private — personal use.
