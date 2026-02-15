# LiftWeb

LiftWeb is a social lifting app project. The active web application lives in `./liftweb`.

## Project layout

- `liftweb/` — Next.js + Supabase app (active product)
- `LiftCycle/` — reserved folder (currently unused)

## Quick start

```bash
cd liftweb
cp .env.example .env.local
npm ci
npm run dev
```

Then open http://localhost:3000.

## Quality checks

```bash
cd liftweb
npm run lint
npm run build
```

## Notes

- Supabase env vars are required for full app functionality.
- This repo now includes CI for lint + build on pull requests.
