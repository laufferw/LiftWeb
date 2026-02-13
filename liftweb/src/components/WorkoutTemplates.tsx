"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type TemplateRow = {
  id: string;
  name: string;
  created_at: string;
  main_lift_id: string | null;
  lift_ids: string[];
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

export default function WorkoutTemplates() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [liftMap, setLiftMap] = useState<LiftMap>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setTemplates([]);
        return;
      }

      const { data: templateData, error: templateError } = await supabase
        .from("workout_templates")
        .select("id,name,created_at,main_lift_id,lift_ids")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (templateError) {
        setError(templateError.message);
        return;
      }

      const templateRows = (templateData ?? []) as TemplateRow[];
      setTemplates(templateRows);

      const liftIds = Array.from(
        new Set(templateRows.flatMap((template) => template.lift_ids)),
      );
      if (liftIds.length === 0) {
        setLiftMap({});
        return;
      }

      const { data: liftData } = await supabase
        .from("lifts")
        .select("id,name")
        .in("id", liftIds);

      const map = (liftData ?? []).reduce<LiftMap>((acc, lift) => {
        acc[lift.id] = { name: lift.name };
        return acc;
      }, {});

      setLiftMap(map);
    };

    load();
  }, []);

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
          Templates
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-ink font-[var(--font-display)]">
          Your workout library
        </h2>
        <p className="mt-2 text-sm text-muted">
          Build templates from your lift list. Pick a main lift to highlight.
        </p>
        <Link
          href="/workouts/new"
          className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90"
        >
          Create workout
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
          No templates yet. Create your first workout.
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => {
            const mainLiftName = template.main_lift_id
              ? liftMap[template.main_lift_id]?.name
              : null;

            return (
              <div
                key={template.id}
                className="rounded-3xl border border-border bg-surface p-6 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">
                      {template.name}
                    </h3>
                    <p className="text-xs text-muted">
                      Created {formatTimeAgo(template.created_at)}
                    </p>
                  </div>
                  <Link
                    href={`/workouts/${template.id}`}
                    className="text-xs font-semibold text-muted transition hover:text-ink"
                  >
                    View
                  </Link>
                </div>

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

                {mainLiftName ? (
                  <p className="mt-3 text-xs text-muted">
                    Main lift: <span className="text-ink">{mainLiftName}</span>
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
