# liftweb app

Next.js + TypeScript + Supabase app for LiftWeb.

## Requirements

- Node.js 20+
- npm
- Supabase project (URL + anon key)

## Local development

1. Copy environment template:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm ci
```

3. Start dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — local dev server
- `npm run lint` — eslint
- `npm run build` — production build
- `npm run start` — run built app
- `npm run test:e2e` — Playwright smoke tests

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Without these, the app can still build, but authenticated/product data features will not work correctly.
