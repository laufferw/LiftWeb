import Link from "next/link";

type LogCardData = {
  id: string;
  userHandle: string;
  userName: string;
  time: string;
  liftName: string;
  topSet: string;
  backoff: string;
  notes: string;
  tags?: string[];
};

type LogCardProps = {
  log: LogCardData;
};

export default function LogCard({ log }: LogCardProps) {
  return (
    <article className="rounded-3xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/u/${log.userHandle}`} className="text-sm font-semibold text-ink">
            {log.userName}
          </Link>
          <p className="text-xs text-muted">@{log.userHandle} · {log.time}</p>
        </div>
        <Link
          href={`/log/${log.id}`}
          className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-ink transition hover:border-ink/30"
        >
          Share
        </Link>
      </div>

      <div className="mt-4">
        <Link
          href={`/log/${log.id}`}
          className="text-lg font-semibold text-ink"
        >
          {log.liftName}
        </Link>
        <p className="mt-1 text-sm text-muted">Top set: {log.topSet}</p>
        <p className="text-sm text-muted">Back-off: {log.backoff}</p>
      </div>

      <p className="mt-4 text-sm text-ink/80">{log.notes}</p>

      {log.tags && log.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {log.tags.map((tag) => (
            <span
              key={`${log.id}-${tag}`}
              className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between text-xs text-muted">
        <span>Public log</span>
        <Link href={`/log/${log.id}`} className="text-xs font-semibold text-muted transition hover:text-ink">
          View details
        </Link>
      </div>
    </article>
  );
}

export type { LogCardData };
