"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type SetRow = {
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_lbs: number;
  strength_exercises: {
    name: string;
  };
};

type Session = {
  id: string;
  date: string;
  notes: string | null;
  sets: SetRow[];
  totalVolume: number;
  exerciseSummaries: { name: string; summary: string }[];
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const buildExerciseSummaries = (sets: SetRow[]) => {
  const grouped: Record<string, { name: string; sets: { reps: number; weight: number }[] }> = {};

  for (const s of sets) {
    const exId = s.exercise_id;
    if (!grouped[exId]) {
      grouped[exId] = { name: s.strength_exercises.name, sets: [] };
    }
    grouped[exId].sets.push({ reps: s.reps, weight: s.weight_lbs });
  }

  return Object.values(grouped).map((g) => {
    // Group identical sets for compact display (e.g. 3×5 @ 165 lbs)
    const buckets: Record<string, { reps: number; weight: number; count: number }> = {};
    for (const s of g.sets) {
      const key = `${s.reps}@${s.weight}`;
      if (!buckets[key]) buckets[key] = { reps: s.reps, weight: s.weight, count: 0 };
      buckets[key].count++;
    }

    const parts = Object.values(buckets).map(
      (b) => `${b.count}\u00d7${b.reps} @ ${b.weight} lbs`,
    );

    return { name: g.name, summary: parts.join(", ") };
  });
};

export default function StrengthHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data: sessionRows } = await supabase
        .from("strength_sessions")
        .select("id, date, notes")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (!sessionRows || sessionRows.length === 0) {
        setLoading(false);
        return;
      }

      const sessionIds = sessionRows.map((s) => s.id);

      const { data: setRows } = await supabase
        .from("strength_sets")
        .select("session_id, exercise_id, set_number, reps, weight_lbs, strength_exercises(name)")
        .in("session_id", sessionIds)
        .order("set_number");

      const setsBySession: Record<string, SetRow[]> = {};
      for (const row of (setRows ?? []) as unknown as (SetRow & { session_id: string })[]) {
        if (!setsBySession[row.session_id]) setsBySession[row.session_id] = [];
        setsBySession[row.session_id].push(row);
      }

      const built: Session[] = sessionRows.map((s) => {
        const sets = setsBySession[s.id] ?? [];
        const totalVolume = sets.reduce((sum, st) => sum + st.weight_lbs * st.reps, 0);
        return {
          id: s.id,
          date: s.date,
          notes: s.notes,
          sets,
          totalVolume,
          exerciseSummaries: buildExerciseSummaries(sets),
        };
      });

      setSessions(built);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">
        Loading history...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-white px-6 py-8 text-center">
          <p className="text-sm text-muted">
            No sessions yet — log your first workout!
          </p>
        </div>
        <Link
          href="/strength/log"
          className="block w-full rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90"
        >
          Start Workout
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const expanded = expandedId === session.id;
        return (
          <button
            key={session.id}
            type="button"
            onClick={() => setExpandedId(expanded ? null : session.id)}
            className="w-full rounded-2xl border border-border bg-white px-5 py-4 text-left transition hover:border-ink/20"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-ink">
                {formatDate(session.date)}
              </h3>
              <span className="text-xs text-muted">
                {session.totalVolume.toLocaleString()} lbs
              </span>
            </div>

            {!expanded && session.exerciseSummaries.length > 0 && (
              <p className="mt-1 truncate text-xs text-muted">
                {session.exerciseSummaries.map((e) => e.name).join(", ")}
              </p>
            )}

            {expanded && (
              <div className="mt-3 space-y-1">
                {session.exerciseSummaries.map((es) => (
                  <div key={es.name} className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-ink">{es.name}</span>
                    <span className="text-xs text-muted">{es.summary}</span>
                  </div>
                ))}
                {session.notes && (
                  <p className="mt-2 text-xs text-muted italic">{session.notes}</p>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
