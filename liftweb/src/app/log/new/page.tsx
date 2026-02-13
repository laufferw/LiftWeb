import { Suspense } from "react";
import LogForm from "@/components/LogForm";
import PageShell from "@/components/PageShell";

export default function NewLogPage() {
  return (
    <PageShell title="Log a workout" subtitle="New session">
      <p className="text-sm text-muted">
        Share your session details publicly. Logs are visible to everyone.
      </p>
      <div className="mt-6">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">
              Loading log form...
            </div>
          }
        >
          <LogForm />
        </Suspense>
      </div>
    </PageShell>
  );
}
