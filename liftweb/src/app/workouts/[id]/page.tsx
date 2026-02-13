import PageShell from "@/components/PageShell";
import WorkoutDetail from "@/components/WorkoutDetail";

type WorkoutDetailPageProps = {
  params: { id: string };
};

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  return (
    <PageShell title="Workout template" subtitle="Template detail" variant="plain">
      <WorkoutDetail id={params.id} />
    </PageShell>
  );
}
