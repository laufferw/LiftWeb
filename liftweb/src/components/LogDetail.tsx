"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type LogDetailProps = {
  logId: string;
};

type LogDetailState = {
  userId: string;
  liftName: string;
  time: string;
  userHandle: string;
  userName: string;
  topSet: string;
  backoff: string;
  notes: string;
  tags: string[];
};

const formatWeight = (weight: number) => `${Math.round(weight)} lbs`;

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function LogDetail({ logId }: LogDetailProps) {
  const [state, setState] = useState<LogDetailState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: logData, error: logError } = await supabase
        .from("workout_logs")
        .select(
          "id,user_id,created_at,lift_name,top_set_weight,top_set_reps,backoff_weight,backoff_reps,notes,tags",
        )
        .eq("id", logId)
        .single();

      if (logError || !logData) {
        setError(logError?.message ?? "Log not found.");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("handle,display_name")
        .eq("id", logData.user_id)
        .maybeSingle();

      setState({
        userId: logData.user_id,
        liftName: logData.lift_name,
        time: formatTimestamp(logData.created_at),
        userHandle: profileData?.handle ?? "unknown",
        userName: profileData?.display_name ?? "Anonymous",
        topSet: `${formatWeight(logData.top_set_weight)} x ${logData.top_set_reps}`,
        backoff: `${formatWeight(logData.backoff_weight)} x ${logData.backoff_reps}`,
        notes: logData.notes ?? "",
        tags: logData.tags ?? [],
      });
    };

    load();
  }, [logId]);

  const handleReport = async () => {
    if (!state) return;
    setActionMessage(null);
    const reason = window.prompt("Report reason:");
    if (!reason) return;

    setIsReporting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const reporterId = sessionData.session?.user.id;
    if (!reporterId) {
      setActionMessage("Sign in to report.");
      setIsReporting(false);
      return;
    }

    const { error: reportError } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      target_log_id: logId,
      reason,
    });

    if (reportError) {
      setActionMessage(reportError.message);
    } else {
      setActionMessage("Report submitted.");
    }
    setIsReporting(false);
  };

  const handleBlock = async () => {
    if (!state) return;
    setActionMessage(null);
    setIsBlocking(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const blockerId = sessionData.session?.user.id;
    if (!blockerId) {
      setActionMessage("Sign in to block.");
      setIsBlocking(false);
      return;
    }

    if (blockerId === state.userId) {
      setActionMessage("You cannot block yourself.");
      setIsBlocking(false);
      return;
    }

    const { error: blockError } = await supabase.from("blocks").insert({
      blocker_id: blockerId,
      blocked_id: state.userId,
    });

    if (blockError) {
      setActionMessage(blockError.message);
    } else {
      setActionMessage("User blocked. Their logs are now hidden.");
    }
    setIsBlocking(false);
  };

  const handleShare = async () => {
    if (!state) return;
    const shareUrl = `${window.location.origin}/log/${logId}`;
    setShareMessage(null);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${state.liftName} • LiftCycle`,
          text: `${state.userName} logged ${state.liftName}.`,
          url: shareUrl,
        });
        setShareMessage("Shared.");
        return;
      } catch {
        setShareMessage("Share canceled.");
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Link copied.");
    } catch {
      setShareMessage("Copy failed.");
    }
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        {error}
      </div>
    );
  }

  if (!state) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        Loading log...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
        {state.time}
      </p>
      <h2 className="mt-4 text-3xl font-semibold text-ink font-[var(--font-display)]">
        {state.liftName}
      </h2>
      <p className="mt-2 text-sm text-muted">
        by{" "}
        <Link href={`/u/${state.userHandle}`} className="font-semibold text-ink">
          {state.userName}
        </Link>
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-base/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Top set
          </p>
          <p className="mt-2 text-lg font-semibold text-ink">{state.topSet}</p>
        </div>
        <div className="rounded-2xl border border-border bg-base/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Back-off
          </p>
          <p className="mt-2 text-lg font-semibold text-ink">{state.backoff}</p>
        </div>
      </div>

      {state.notes ? (
        <p className="mt-6 text-sm text-ink/80">{state.notes}</p>
      ) : null}

      {state.tags.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {state.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30"
        >
          Share log
        </button>
        <button
          type="button"
          onClick={handleReport}
          disabled={isReporting}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isReporting ? "Reporting..." : "Report log"}
        </button>
        <button
          type="button"
          onClick={handleBlock}
          disabled={isBlocking}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isBlocking ? "Blocking..." : "Block user"}
        </button>
      </div>

      {actionMessage ? (
        <p className="mt-4 text-sm text-muted" role="status">
          {actionMessage}
        </p>
      ) : null}
      {shareMessage ? (
        <p className="mt-2 text-sm text-muted" role="status">
          {shareMessage}
        </p>
      ) : null}
    </div>
  );
}
