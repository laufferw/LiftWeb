# 🏋️ LiftWeb

**A simple, open-source lifting app for people who just want to train.**

Track your lifts, build workouts, explore what others are doing, and own your data. No subscriptions, no ads, no bloat.

[![CI](https://github.com/laufferw/LiftWeb/actions/workflows/ci.yml/badge.svg)](https://github.com/laufferw/LiftWeb/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<!-- TODO: Add a screenshot or demo GIF here -->
<!-- ![LiftWeb Screenshot](screenshot.png) -->

## Features

- 📝 **Log workouts** — quick, no-nonsense workout logging
- 🏗️ **Workout builder** — create and reuse workout templates
- 🔍 **Explore** — see what the community is lifting
- 👤 **Profiles** — your lifting history in one place
- 🎚️ **Lift manager** — organize your exercises
- 🔐 **Auth** — sign up with magic link (Supabase Auth)
- 📱 **Mobile-friendly** — built for the gym, works on your phone

## Tech Stack

- [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (auth + database)
- [Playwright](https://playwright.dev/) (e2e testing)

## Quick Start

```bash
cd liftweb
cp .env.example .env.local   # Add your Supabase credentials
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase Setup

You'll need a [Supabase](https://supabase.com/) project (free tier works). Add your project URL and anon key to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright tests |

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

The guiding principle: **each version should be simpler than the last.**

## Support

If LiftWeb is useful to you, consider supporting the project:

[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-pink)](https://github.com/sponsors/laufferw)

No pressure — but $20 from someone who likes the app goes a long way. 🙏

## License

[MIT](LICENSE) — use it, fork it, make it yours.
