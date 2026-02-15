import Feed from "@/components/Feed";
import PageShell from "@/components/PageShell";

export default function ExplorePage() {
  return (
    <PageShell title="Explore the community" subtitle="Trending lifts" variant="plain">
      <p className="mb-4 text-sm text-muted">
        Discover recent logs, search by lift/user, and filter by tags.
      </p>
      <Feed showFilters limit={50} />
    </PageShell>
  );
}
