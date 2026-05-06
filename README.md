# JRC Shop Card (web)

Jobs, customers, employees, materials, photos, reports, PDF export, and optional Gemini roof previews. This repository is the **shipping product** after pivoting from the historical iOS app.

## Requirements

- Node.js 20+
- PostgreSQL (local Docker, Neon, Vercel Postgres, etc.)

## Setup

```bash
cp .env.example .env
# Edit .env: DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, keys as needed

npm install
npx prisma migrate deploy
# optional demo data
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:seed` | Seed database |

## Deploy

Typical target: **Vercel** with Postgres, `DATABASE_URL`, `NEXTAUTH_URL`, `AUTH_SECRET`, optional `BLOB_READ_WRITE_TOKEN`, Google Maps keys, `GEMINI_API_KEY` for roof previews.

## History

Application logic was ported from a SwiftUI codebase tracked in the sibling folder `JRC_Shop_Card` (iOS). That repo retains the old app for reference; active development is here.
