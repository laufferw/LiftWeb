import PageShell from "@/components/PageShell";

export default function ExplorePage() {
  return (
    <PageShell title="Explore the community" subtitle="Trending lifts">
      <p className="text-sm text-muted">
        Search and trending filters will live here. For MVP, this page will show
        the global feed with tags and lift discovery.
      </p>
    </PageShell>
  );
}
