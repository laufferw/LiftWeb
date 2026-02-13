"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import LogCard, { LogCardData } from "@/components/LogCard";

type ProfileDetailProps = {
  handle: string;
};

type ProfileState = {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
};

type RawLog = {
  id: string;
  created_at: string;
  lift_name: string;
  top_set_weight: number;
  top_set_reps: number;
  backoff_weight: number;
  backoff_reps: number;
  notes: string | null;
  tags: string[] | null;
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

export default function ProfileDetail({ handle }: ProfileDetailProps) {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [logs, setLogs] = useState<LogCardData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [stats, setStats] = useState<{ totalLogs: number; volume: number } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<"idle" | "loading" | "error">("idle");
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id,handle,display_name,bio")
        .eq("handle", handle)
        .maybeSingle();

      if (profileError || !profileData) {
        setError(profileError?.message ?? "Profile not found.");
        return;
      }

      setProfile({
        id: profileData.id,
        handle: profileData.handle,
        displayName: profileData.display_name ?? "",
        bio: profileData.bio ?? null,
      });
      setEditDisplayName(profileData.display_name ?? "");
      setEditBio(profileData.bio ?? "");

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user.id;
      setCurrentUserId(currentUserId ?? null);
      if (currentUserId) {
        const { data: blockData } = await supabase
          .from("blocks")
          .select("id")
          .eq("blocker_id", currentUserId)
          .eq("blocked_id", profileData.id)
          .maybeSingle();

        if (blockData) {
          setIsBlocked(true);
          return;
        }
      }

      const { data: logData } = await supabase
        .from("workout_logs")
        .select(
          "id,created_at,lift_name,top_set_weight,top_set_reps,backoff_weight,backoff_reps,notes,tags",
        )
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const mapped = (logData ?? []).map((log: RawLog) => ({
        id: log.id,
        userHandle: profileData.handle,
        userName: profileData.display_name ?? "Anonymous",
        time: formatTimeAgo(log.created_at),
        liftName: log.lift_name,
        topSet: `${formatWeight(log.top_set_weight)} x ${log.top_set_reps}`,
        backoff: `${formatWeight(log.backoff_weight)} x ${log.backoff_reps}`,
        notes: log.notes ?? "",
        tags: log.tags ?? [],
      } satisfies LogCardData));

      setLogs(mapped);
      const volume = (logData ?? []).reduce((total: number, log: RawLog) => {
        return (
          total +
          log.top_set_weight * log.top_set_reps +
          log.backoff_weight * log.backoff_reps
        );
      }, 0);
      setStats({ totalLogs: (logData ?? []).length, volume });
    };

    load();
  }, [handle]);

  const isOwner = profile?.id === currentUserId;

  const handleProfileUpdate = async () => {
    if (!profile) return;
    setEditStatus("loading");
    setEditMessage(null);

    if (!editDisplayName.trim()) {
      setEditStatus("error");
      setEditMessage("Display name is required.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: editDisplayName.trim(),
        bio: editBio.trim() || null,
      })
      .eq("id", profile.id);

    if (updateError) {
      setEditStatus("error");
      setEditMessage(updateError.message);
      return;
    }

    setProfile({
      ...profile,
      displayName: editDisplayName.trim(),
      bio: editBio.trim() || null,
    });
    setEditStatus("idle");
    setEditMessage("Profile updated.");
    setIsEditing(false);
  };

  const handleReport = async () => {
    if (!profile) return;
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
      target_user_id: profile.id,
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
    if (!profile) return;
    setActionMessage(null);
    setIsBlocking(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const blockerId = sessionData.session?.user.id;
    if (!blockerId) {
      setActionMessage("Sign in to block.");
      setIsBlocking(false);
      return;
    }

    if (blockerId === profile.id) {
      setActionMessage("You cannot block yourself.");
      setIsBlocking(false);
      return;
    }

    const { error: blockError } = await supabase.from("blocks").insert({
      blocker_id: blockerId,
      blocked_id: profile.id,
    });

    if (blockError) {
      setActionMessage(blockError.message);
    } else {
      setActionMessage("User blocked. Their logs are now hidden.");
    }
    setIsBlocking(false);
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
          Creator profile
        </p>
        {isEditing ? (
          <div className="mt-3 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Display name
              </label>
              <input
                type="text"
                value={editDisplayName}
                onChange={(event) => setEditDisplayName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Bio
              </label>
              <textarea
                value={editBio}
                onChange={(event) => setEditBio(event.target.value)}
                className="mt-2 min-h-[120px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                placeholder="Share your training focus"
              />
            </div>
          </div>
        ) : (
          <>
            <h2 className="mt-3 text-3xl font-semibold text-ink font-[var(--font-display)]">
              {profile.displayName}
            </h2>
            <p className="mt-1 text-sm text-muted">@{profile.handle}</p>
            {profile.bio ? (
              <p className="mt-4 text-sm text-ink/80">{profile.bio}</p>
            ) : null}
          </>
        )}

        {stats ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-base/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Total logs
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {stats.totalLogs}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-base/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Total volume
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {Math.round(stats.volume).toLocaleString()} lbs
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {isOwner ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30"
              >
                {isEditing ? "Cancel" : "Edit profile"}
              </button>
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleProfileUpdate}
                  disabled={editStatus === "loading"}
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {editStatus === "loading" ? "Saving..." : "Save changes"}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReport}
                disabled={isReporting}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isReporting ? "Reporting..." : "Report profile"}
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={isBlocking}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isBlocking ? "Blocking..." : "Block user"}
              </button>
            </>
          )}
          <Link href="/" className="text-xs font-semibold text-muted">
            Back to feed
          </Link>
        </div>

        {editMessage ? (
          <p className="mt-4 text-sm text-muted" role="status">
            {editMessage}
          </p>
        ) : null}

        {actionMessage ? (
          <p className="mt-4 text-sm text-muted" role="status">
            {actionMessage}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {isBlocked ? (
          <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
            You blocked this user. Their logs are hidden.
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
            No logs yet.
          </div>
        ) : (
          logs.map((log) => <LogCard key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}
