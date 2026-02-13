import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-base/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight font-[var(--font-display)]"
        >
          LiftCycle
        </Link>
        <div className="flex items-center gap-3">
          <AuthStatus />
          <Link
            href="/log/new"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90"
          >
            Log workout
          </Link>
        </div>
      </div>
    </header>
  );
}
