"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

type ReportRow = {
  id: string;
  created_at: string;
  reason: string;
  status: string;
  reporter_id: string;
  target_log_id: string | null;
  target_user_id: string | null;
};

const STATUS_VALUES = ["open", "reviewed", "resolved", "dismissed"] as const;

export default function ModerationReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!isSupabaseConfigured) {
        if (active) {
          setError("Supabase is not configured.");
          setIsLoading(false);
        }
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        if (active) {
          setError("Sign in to access moderation reports.");
          setIsLoading(false);
        }
        return;
      }

      const { data: modData } = await supabase
        .from("moderators")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!modData) {
        if (active) {
          setIsModerator(false);
          setIsLoading(false);
        }
        return;
      }

      const { data, error: reportError } = await supabase
        .from("reports")
        .select("id,created_at,reason,status,reporter_id,target_log_id,target_user_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!active) return;

      if (reportError) {
        setError(reportError.message);
        setIsLoading(false);
        return;
      }

      setIsModerator(true);
      setReports((data ?? []) as ReportRow[]);
      setIsLoading(false);
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error: updateError } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  if (isLoading) {
    return <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">Loading moderation queue...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">{error}</div>;
  }

  if (!isModerator) {
    return <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">You are not a moderator yet. Add your user to <code>public.moderators</code> in Supabase to unlock this queue.</div>;
  }

  if (reports.length === 0) {
    return <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">No reports in queue.</div>;
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <article key={report.id} className="rounded-3xl border border-border bg-surface p-5 shadow-card space-y-3">
          <p className="text-xs text-muted">{new Date(report.created_at).toLocaleString()} · reporter {report.reporter_id.slice(0, 8)}…</p>
          <p className="text-sm text-ink">{report.reason}</p>
          <p className="text-xs text-muted">target log: {report.target_log_id ?? "—"} · target user: {report.target_user_id ?? "—"}</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_VALUES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateStatus(report.id, status)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${report.status === status ? "bg-accentSoft text-accent" : "border border-border bg-white text-muted"}`}
              >
                {status}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
