"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import LogCard, { LogCardData } from "@/components/LogCard";

type RawLog = {
  id: string;
  user_id: string;
  created_at: string;
  lift_name: string;
  top_set_weight: number;
  top_set_reps: number;
  backoff_weight: number;
  backoff_reps: number;
  notes: string | null;
  tags: string[] | null;
};

type ProfileMap = Record<string, { handle: string; display_name: string | null }>;

type FeedProps = {
  limit?: number;
  showFilters?: boolean;
};

const formatWeight = (weight: number) => `${Math.round(weight)} lbs`;

const formatTimeAgo = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

export default function Feed({ limit = 20, showFilters = false }: FeedProps) {
  const [logs, setLogs] = useState<LogCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured) {
        setError("Supabase is not configured. Add env vars to load the feed.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user.id;
      let blockedIds: string[] = [];
      if (currentUserId) {
        const { data: blockData } = await supabase
          .from("blocks")
          .select("blocked_id")
          .eq("blocker_id", currentUserId);

        blockedIds = (blockData ?? []).map((row) => row.blocked_id);
      }

      const { data: logData, error: logError } = await supabase
        .from("workout_logs")
        .select(
          "id,user_id,created_at,lift_name,top_set_weight,top_set_reps,backoff_weight,backoff_reps,notes,tags",
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (logError) {
        setError(logError.message);
        setIsLoading(false);
        return;
      }

      const logRows = (logData ?? []).filter(
        (log) => !blockedIds.includes(log.user_id),
      ) as RawLog[];
      const userIds = Array.from(new Set(logRows.map((log) => log.user_id)));

      let profileMap: ProfileMap = {};
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id,handle,display_name")
          .in("id", userIds);

        profileMap = (profileData ?? []).reduce<ProfileMap>((acc, profile) => {
          acc[profile.id] = {
            handle: profile.handle,
            display_name: profile.display_name,
          };
          return acc;
        }, {});
      }

      const mapped = logRows.map((log) => {
        const profile = profileMap[log.user_id];
        return {
          id: log.id,
          userHandle: profile?.handle ?? "unknown",
          userName: profile?.display_name ?? "Anonymous",
          time: formatTimeAgo(log.created_at),
          liftName: log.lift_name,
          topSet: `${formatWeight(log.top_set_weight)} x ${log.top_set_reps}`,
          backoff: `${formatWeight(log.backoff_weight)} x ${log.backoff_reps}`,
          notes: log.notes ?? "",
          tags: log.tags ?? [],
        } satisfies LogCardData;
      });

      setLogs(mapped);
      setIsLoading(false);
    };

    void load();
  }, [limit]);

  const tagOptions = useMemo(
    () => ["all", ...new Set(logs.flatMap((log) => log.tags ?? []))],
    [logs],
  );

  const filteredLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesTag = activeTag === "all" || (log.tags ?? []).includes(activeTag);
      if (!matchesTag) return false;
      if (!q) return true;

      return [log.userName, log.userHandle, log.liftName, log.notes, ...(log.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [logs, activeTag, query]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        Loading logs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        Could not load logs: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters ? (
        <div className="rounded-3xl border border-border bg-surface p-4 shadow-card">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by lift, user, note, or tag"
            className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeTag === tag
                    ? "bg-accentSoft text-accent"
                    : "border border-border bg-white text-muted hover:text-ink"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {filteredLogs.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
          No logs match your filter yet. Try another search or <Link href="/log/new" className="font-semibold text-ink">log a workout</Link>.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredLogs.map((log) => (
            <LogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
