import LiftManager from "@/components/LiftManager";
import PageShell from "@/components/PageShell";

export default function LiftsPage() {
  return (
    <PageShell title="Lifts" subtitle="Progression setup" variant="plain">
      <LiftManager />
    </PageShell>
  );
}
