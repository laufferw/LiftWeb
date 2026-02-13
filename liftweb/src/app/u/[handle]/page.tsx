import PageShell from "@/components/PageShell";
import ProfileDetail from "@/components/ProfileDetail";

type ProfilePageProps = {
  params: { handle: string };
};

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <PageShell title={`@${params.handle}`} subtitle="Creator profile" variant="plain">
      <ProfileDetail handle={params.handle} />
    </PageShell>
  );
}
