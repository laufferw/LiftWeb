import WorkoutTemplates from "@/components/WorkoutTemplates";
import PageShell from "@/components/PageShell";

export default function WorkoutsPage() {
  return (
    <PageShell title="Workouts" subtitle="Plan your week" variant="plain">
      <WorkoutTemplates />
    </PageShell>
  );
}
