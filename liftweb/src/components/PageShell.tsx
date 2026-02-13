import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";

type PageShellProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  variant?: "card" | "plain";
};

export default function PageShell({
  title,
  subtitle,
  children,
  variant = "card",
}: PageShellProps) {
  const header = (
    <div className={variant === "card" ? "" : "mb-6"}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
        {subtitle ?? "LiftCycle"}
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink font-[var(--font-display)]">
        {title}
      </h1>
    </div>
  );

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(255,106,61,0.18),transparent_55%),radial-gradient(circle_at_20%_40%,rgba(255,231,222,0.9),transparent_45%)]" />
      <TopNav />
      <main className="relative mx-auto w-full max-w-3xl px-5 pb-28 pt-10">
        {variant === "card" ? (
          <div className="rounded-3xl border border-border bg-surface/90 p-8 shadow-card backdrop-blur">
            {header}
            {children ? <div className="mt-6">{children}</div> : null}
          </div>
        ) : (
          <div>
            {header}
            {children ? <div>{children}</div> : null}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
