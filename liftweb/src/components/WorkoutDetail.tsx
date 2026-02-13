"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type WorkoutDetailProps = {
  id: string;
};

type TemplateRow = {
  id: string;
  name: string;
  lift_ids: string[];
  main_lift_id: string | null;
  created_at: string;
};

type LiftMap = Record<string, { name: string }>;

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

export default function WorkoutDetail({ id }: WorkoutDetailProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateRow | null>(null);
  const [liftMap, setLiftMap] = useState<LiftMap>({});
  const [allLifts, setAllLifts] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftLiftIds, setDraftLiftIds] = useState<string[]>([]);
  const [draftMainLiftId, setDraftMainLiftId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: templateData, error: templateError } = await supabase
        .from("workout_templates")
        .select("id,name,lift_ids,main_lift_id,created_at")
        .eq("id", id)
        .single();

      if (templateError || !templateData) {
        setError(templateError?.message ?? "Workout not found.");
        return;
      }

      const templateRow = templateData as TemplateRow;
      setTemplate(templateRow);
      setDraftName(templateRow.name);
      setDraftLiftIds(templateRow.lift_ids);
      setDraftMainLiftId(templateRow.main_lift_id);

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (userId) {
        const { data: userLifts } = await supabase
          .from("lifts")
          .select("id,name")
          .eq("user_id", userId)
          .order("name");

        setAllLifts((userLifts ?? []) as { id: string; name: string }[]);
      }

      const { data: liftData } = await supabase
        .from("lifts")
        .select("id,name")
        .in("id", templateData.lift_ids);

      const map = (liftData ?? []).reduce<LiftMap>((acc, lift) => {
        acc[lift.id] = { name: lift.name };
        return acc;
      }, {});

      setLiftMap(map);
    };

    load();
  }, [id]);

  const toggleLift = (liftId: string) => {
    setDraftLiftIds((prev) => {
      const exists = prev.includes(liftId);
      const updated = exists ? prev.filter((item) => item !== liftId) : [...prev, liftId];
      if (draftMainLiftId && !updated.includes(draftMainLiftId)) {
        setDraftMainLiftId(null);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!template) return;
    setIsSaving(true);
    setMessage(null);

    if (!draftName.trim()) {
      setMessage("Workout name is required.");
      setIsSaving(false);
      return;
    }

    if (draftLiftIds.length === 0) {
      setMessage("Select at least one lift.");
      setIsSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("workout_templates")
      .update({
        name: draftName.trim(),
        lift_ids: draftLiftIds,
        main_lift_id: draftMainLiftId,
      })
      .eq("id", template.id);

    if (updateError) {
      setMessage(updateError.message);
      setIsSaving(false);
      return;
    }

    setTemplate({
      ...template,
      name: draftName.trim(),
      lift_ids: draftLiftIds,
      main_lift_id: draftMainLiftId,
    });
    setIsSaving(false);
    setIsEditing(false);
    setMessage("Workout updated.");
  };

  const handleDelete = async () => {
    if (!template) return;
    const confirmDelete = window.confirm("Delete this workout template?");
    if (!confirmDelete) return;

    setIsDeleting(true);
    setMessage(null);
    const { error: deleteError } = await supabase
      .from("workout_templates")
      .delete()
      .eq("id", template.id);

    if (deleteError) {
      setMessage(deleteError.message);
      setIsDeleting(false);
      return;
    }

    router.push("/workouts");
  };

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        {error}
      </div>
    );
  }

  if (!template) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        Loading workout...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Created {formatTimeAgo(template.created_at)}
            </p>
            {isEditing ? (
              <input
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-border bg-white px-4 py-2 text-lg font-semibold text-ink outline-none transition focus:border-ink/40"
              />
            ) : (
              <h2 className="mt-3 text-3xl font-semibold text-ink font-[var(--font-display)]">
                {template.name}
              </h2>
            )}
            <p className="mt-2 text-sm text-muted">
              {template.lift_ids.length} lifts · Main lift{" "}
              {template.main_lift_id ? liftMap[template.main_lift_id]?.name : "not set"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Select lifts
              </p>
              <div className="mt-3 grid gap-3">
                {allLifts.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-base/70 p-4 text-sm text-muted">
                    Add lifts before editing templates.
                  </div>
                ) : (
                  allLifts.map((lift) => {
                    const selected = draftLiftIds.includes(lift.id);
                    return (
                      <button
                        key={lift.id}
                        type="button"
                        onClick={() => toggleLift(lift.id)}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          selected
                            ? "border-accent bg-accentSoft text-accent"
                            : "border-border bg-white text-ink hover:border-ink/30"
                        }`}
                      >
                        <span>{lift.name}</span>
                        <span className="text-xs">{selected ? "Selected" : "Tap"}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {draftLiftIds.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                  Main lift
                </p>
                <div className="mt-3 grid gap-3">
                  {draftLiftIds.map((liftId) => {
                    const lift = allLifts.find((item) => item.id === liftId);
                    const isMain = draftMainLiftId === liftId;
                    return (
                      <button
                        key={liftId}
                        type="button"
                        onClick={() => setDraftMainLiftId(liftId)}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          isMain
                            ? "border-accent bg-accentSoft text-accent"
                            : "border-border bg-white text-ink hover:border-ink/30"
                        }`}
                      >
                        <span>{lift?.name ?? "Lift"}</span>
                        <span className="text-xs">{isMain ? "Main" : "Set"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {template.lift_ids.map((liftId) => (
              <span
                key={liftId}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  template.main_lift_id === liftId
                    ? "bg-accentSoft text-accent"
                    : "bg-base/80 text-muted"
                }`}
              >
                {liftMap[liftId]?.name ?? "Lift"}
              </span>
            ))}
          </div>
        )}

        {message ? (
          <p className="mt-4 text-sm text-muted" role="status">
            {message}
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
          Next steps
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/log/new?template=${template.id}`}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accent/90"
          >
            Log from this template
          </Link>
          <Link
            href="/workouts"
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/30"
          >
            Back to workouts
          </Link>
        </div>
      </div>
    </div>
  );
}
