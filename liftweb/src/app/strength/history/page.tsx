import PageShell from "@/components/PageShell";
import FeatureGate from "@/components/FeatureGate";
import StrengthHistory from "@/components/StrengthHistory";

export default function StrengthHistoryPage() {
  return (
    <PageShell title="History" subtitle="Past workouts" variant="plain">
      <FeatureGate requireAuth requireProfile title="Workout history">
        <StrengthHistory />
      </FeatureGate>
    </PageShell>
  );
}
