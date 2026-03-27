"use client";

import { useSearchParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import FeatureGate from "@/components/FeatureGate";
import StrengthLog from "@/components/StrengthLog";

export default function StrengthLogPage() {
  // Using a timestamp-based key forces StrengthLog to fully remount
  // on every page visit, guaranteeing all checkboxes start unchecked.
  const key = typeof window !== "undefined" ? String(Date.now()) : "ssr";

  return (
    <PageShell title="Log Workout" subtitle="Strength session">
      <FeatureGate requireAuth requireProfile title="Log strength workout">
        <StrengthLog key={key} />
      </FeatureGate>
    </PageShell>
  );
}
