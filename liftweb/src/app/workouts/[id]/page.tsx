import PageShell from "@/components/PageShell";
import WorkoutDetail from "@/components/WorkoutDetail";
import FeatureGate from "@/components/FeatureGate";

type WorkoutDetailPageProps = {
  params: { id: string };
};

export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  return (
    <PageShell title="Workout template" subtitle="Template detail" variant="plain">
      <FeatureGate requireAuth requireProfile title="View your workout template">
        <WorkoutDetail id={params.id} />
      </FeatureGate>
    </PageShell>
  );
}
