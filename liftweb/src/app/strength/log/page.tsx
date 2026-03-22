import PageShell from "@/components/PageShell";
import FeatureGate from "@/components/FeatureGate";
import StrengthLog from "@/components/StrengthLog";

export default function StrengthLogPage() {
  return (
    <PageShell title="Log Workout" subtitle="Strength session">
      <FeatureGate requireAuth requireProfile title="Log strength workout">
        <StrengthLog />
      </FeatureGate>
    </PageShell>
  );
}
