import OnboardingForm from "@/components/OnboardingForm";
import PageShell from "@/components/PageShell";

export default function OnboardingPage() {
  return (
    <PageShell title="Set up your profile" subtitle="Welcome">
      <p className="text-sm text-muted">
        Choose a handle and display name. Your profile will be public.
      </p>
      <div className="mt-6">
        <OnboardingForm />
      </div>
    </PageShell>
  );
}
