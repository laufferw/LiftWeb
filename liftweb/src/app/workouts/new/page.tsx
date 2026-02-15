import WorkoutBuilder from "@/components/WorkoutBuilder";
import PageShell from "@/components/PageShell";
import FeatureGate from "@/components/FeatureGate";

export default function NewWorkoutPage() {
  return (
    <PageShell title="Create a workout" subtitle="Template builder" variant="plain">
      <FeatureGate requireAuth requireProfile title="Create workout templates">
        <WorkoutBuilder />
      </FeatureGate>
    </PageShell>
  );
}
