import LogDetail from "@/components/LogDetail";
import PageShell from "@/components/PageShell";

type LogDetailPageProps = {
  params: { id: string };
};

export default function LogDetailPage({ params }: LogDetailPageProps) {
  return (
    <PageShell title="Workout log" subtitle="Public log">
      <LogDetail logId={params.id} />
    </PageShell>
  );
}
