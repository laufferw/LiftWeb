import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import Feed from "@/components/Feed";
import TopNav from "@/components/TopNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,106,61,0.18),transparent_55%),radial-gradient(circle_at_20%_40%,rgba(255,231,222,0.9),transparent_45%)]" />
      <TopNav />
      <main className="relative mx-auto w-full max-w-5xl px-5 pb-28 pt-10">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-surface/90 p-8 shadow-card backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Public training logs
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink font-[var(--font-display)] sm:text-5xl lg:text-6xl">
              Lift out loud.
            </h1>
            <p className="mt-4 text-base text-muted sm:text-lg">
              LiftCycle keeps your progression public, your workouts structured, and
              your wins shareable in seconds.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/log/new"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90"
              >
                Log a workout
              </Link>
              <Link
                href="/workouts"
                className="rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink/30"
              >
                Plan your week
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-border bg-surface/90 p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Weekly focus
              </p>
              <p className="mt-3 text-2xl font-semibold text-ink">
                Top sets, back-offs, and form notes all in one view.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-surface/90 p-6 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Creator-ready
              </p>
              <p className="mt-3 text-2xl font-semibold text-ink">
                Shareable logs with copy-ready summaries and link previews.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Global feed
            </h2>
            <Link href="/explore" className="text-sm font-semibold text-ink">
              Explore
            </Link>
          </div>
          <div className="mt-5">
            <Feed />
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
