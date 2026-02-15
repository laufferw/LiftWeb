import LiftManager from "@/components/LiftManager";
import PageShell from "@/components/PageShell";
import FeatureGate from "@/components/FeatureGate";

export default function LiftsPage() {
  return (
    <PageShell title="Lifts" subtitle="Progression setup" variant="plain">
      <FeatureGate requireAuth requireProfile title="Manage lifts">
        <LiftManager />
      </FeatureGate>
    </PageShell>
  );
}
