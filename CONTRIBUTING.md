# Contributing to LiftWeb

Thanks for your interest in contributing! LiftWeb is an open community project and we welcome help of all kinds — code, design, bug reports, ideas, and feedback.

## Getting Started

1. **Fork** the repo and clone your fork
2. Set up the app locally:

```bash
cd liftweb
cp .env.example .env.local
npm ci
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

You'll need a Supabase project for full functionality. See the [README](README.md) for details.

## Making Changes

- Create a branch from `main` for your work
- Keep changes focused — one feature or fix per PR
- Run `npm run lint` and `npm run build` before submitting (CI checks these too)
- Write a clear PR description explaining what and why

## What We're Looking For

- Bug fixes
- UI/UX improvements
- New features that keep the app simple and focused
- Documentation improvements
- Accessibility improvements
- Performance optimizations

## Philosophy

LiftWeb follows a "each version simpler than the last" principle. Before adding something new, ask: does this make the app simpler and better for lifters, or just more complex?

## Code Style

- TypeScript throughout
- React functional components
- Tailwind CSS for styling
- Follow existing patterns in the codebase

## Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser/device info if relevant

## Questions?

Open a discussion or issue — happy to help you get oriented.
