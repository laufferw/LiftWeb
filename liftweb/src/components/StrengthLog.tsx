"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Exercise = {
  id: string;
  name: string;
  category: string;
  default_sets: number;
  default_reps: number;
};

type SetEntry = {
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseSets = {
  exercise: Exercise;
  sets: SetEntry[];
};

const EXERCISE_ORDER = [
  "Clean",
  "Squat",
  "Bench",
  "OHP",
  "Pull-up",
  "Romanian Deadlift",
  "Pendlay Row",
  "Face Pull",
];

export default function StrengthLog() {
  const router = useRouter();
  const [exerciseSets, setExerciseSets] = useState<ExerciseSets[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  // sessionKey forces a full remount each time the log page is visited,
  // ensuring all checkboxes start unchecked on every new workout.
  const [sessionKey] = useState(() => Date.now());

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      const { data: exercises } = await supabase
        .from("strength_exercises")
        .select("id, name, category, default_sets, default_reps");

      if (!exercises) {
        setLoading(false);
        return;
      }

      const sorted = [...exercises].sort((a, b) => {
        const ai = EXERCISE_ORDER.indexOf(a.name);
        const bi = EXERCISE_ORDER.indexOf(b.name);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });

      let recs: Record<string, { weight: number; sets: number; reps: number }> = {};

      if (userId) {
        const { data: recData } = await supabase
          .from("strength_recommendations")
          .select("exercise_id, recommended_weight_lbs, recommended_sets, recommended_reps")
          .eq("user_id", userId);

        if (recData) {
          for (const r of recData) {
            recs[r.exercise_id] = {
              weight: r.recommended_weight_lbs,
              sets: r.recommended_sets,
              reps: r.recommended_reps,
            };
          }
        }
      }

      const initial: ExerciseSets[] = sorted.map((ex) => {
        const rec = recs[ex.id];
        const numSets = rec?.sets ?? ex.default_sets;
        const weight = rec?.weight ?? 0;
        const repCount = rec?.reps ?? ex.default_reps;

        return {
          exercise: ex,
          // completed is always false on a new workout — never carry over from DB or prior state
          sets: Array.from({ length: numSets }, () => ({
            weight: weight ? String(weight) : "",
            reps: String(repCount),
            completed: false as const,
          })),
        };
      });

      // Final safety pass: ensure all completed flags are false regardless of any data source
      const clean = initial.map((es) => ({
        ...es,
        sets: es.sets.map((s) => ({ ...s, completed: false })),
      }));
      setExerciseSets(clean);
      setLoading(false);
    };

    load();
  }, [sessionKey]);

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetEntry, value: string | boolean) => {
    setExerciseSets((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const addSet = (exIdx: number) => {
    setExerciseSets((prev) => {
      const next = [...prev];
      const lastSet = next[exIdx].sets[next[exIdx].sets.length - 1];
      next[exIdx] = {
        ...next[exIdx],
        sets: [
          ...next[exIdx].sets,
          {
            weight: lastSet?.weight ?? "",
            reps: lastSet?.reps ?? String(next[exIdx].exercise.default_reps),
            completed: false as const, // new sets always start unchecked
          },
        ],
      };
      return next;
    });
  };

  const handleFinish = async () => {
    setStatus("saving");
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setStatus("error");
      setMessage("You need to sign in to log a workout.");
      return;
    }

    const { data: session, error: sessionError } = await supabase
      .from("strength_sessions")
      .insert({ user_id: user.id, date: new Date().toISOString().split("T")[0] })
      .select("id")
      .single();

    if (sessionError || !session) {
      setStatus("error");
      setMessage(sessionError?.message ?? "Failed to create session.");
      return;
    }

    const sets = exerciseSets.flatMap((es) =>
      es.sets
        .filter((s) => s.weight && s.reps)
        .map((s, idx) => ({
          session_id: session.id,
          exercise_id: es.exercise.id,
          set_number: idx + 1,
          reps: Number(s.reps),
          weight_lbs: Number(s.weight),
          completed: s.completed,
        })),
    );

    if (sets.length === 0) {
      setStatus("error");
      setMessage("Log at least one set before finishing.");
      return;
    }

    const { error: setsError } = await supabase
      .from("strength_sets")
      .insert(sets);

    if (setsError) {
      setStatus("error");
      setMessage(setsError.message);
      return;
    }

    router.push("/strength?saved=1");
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">
        Loading exercises...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {exerciseSets.map((es, exIdx) => (
        <div key={es.exercise.id} className="rounded-2xl border border-border bg-white px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-ink">{es.exercise.name}</h3>
            <span className="text-xs text-muted">{es.exercise.category}</span>
          </div>

          <div className="mt-3 space-y-2">
            {es.sets.map((set, setIdx) => (
              <div key={setIdx} className="flex items-center gap-2">
                <span className="w-6 text-xs text-muted">{setIdx + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={set.weight}
                  onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)}
                  placeholder="lbs"
                  className="w-20 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/40"
                />
                <span className="text-xs text-muted">&times;</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)}
                  placeholder="reps"
                  className="w-16 rounded-xl border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/40"
                />
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={set.completed}
                    onChange={(e) => updateSet(exIdx, setIdx, "completed", e.target.checked)}
                    className="accent-accent"
                  />
                  Done
                </label>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addSet(exIdx)}
            className="mt-2 text-xs font-semibold text-accent transition hover:text-accent/80"
          >
            + Add Set
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={handleFinish}
        disabled={status === "saving"}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "saving" ? "Saving..." : "Finish Workout"}
      </button>

      {message ? (
        <p className="text-sm text-muted" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
