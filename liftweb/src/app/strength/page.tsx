import PageShell from "@/components/PageShell";
import FeatureGate from "@/components/FeatureGate";
import StrengthNextWorkout from "@/components/StrengthNextWorkout";

export default function StrengthPage() {
  return (
    <PageShell title="Strength" subtitle="Next workout" variant="plain">
      <FeatureGate requireAuth requireProfile title="Strength training">
        <StrengthNextWorkout />
      </FeatureGate>
    </PageShell>
  );
}
