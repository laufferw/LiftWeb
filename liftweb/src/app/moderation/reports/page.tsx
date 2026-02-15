import ModerationReports from "@/components/ModerationReports";
import PageShell from "@/components/PageShell";
import FeatureGate from "@/components/FeatureGate";

export default function ModerationReportsPage() {
  return (
    <PageShell title="Moderation queue" subtitle="Reports" variant="plain">
      <FeatureGate requireAuth title="Moderation reports">
        <p className="mb-4 text-sm text-muted">
          Review reports, update status, and keep the community healthy.
        </p>
        <ModerationReports />
      </FeatureGate>
    </PageShell>
  );
}
