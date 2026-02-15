import WorkoutTemplates from "@/components/WorkoutTemplates";
import PageShell from "@/components/PageShell";
import FeatureGate from "@/components/FeatureGate";

export default function WorkoutsPage() {
  return (
    <PageShell title="Workouts" subtitle="Plan your week" variant="plain">
      <FeatureGate requireAuth requireProfile title="Manage workouts">
        <WorkoutTemplates />
      </FeatureGate>
    </PageShell>
  );
}
