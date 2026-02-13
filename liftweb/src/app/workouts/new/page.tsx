import WorkoutBuilder from "@/components/WorkoutBuilder";
import PageShell from "@/components/PageShell";

export default function NewWorkoutPage() {
  return (
    <PageShell title="Create a workout" subtitle="Template builder" variant="plain">
      <WorkoutBuilder />
    </PageShell>
  );
}
