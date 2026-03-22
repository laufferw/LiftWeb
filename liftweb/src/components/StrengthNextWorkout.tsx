"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Recommendation = {
  recommended_weight_lbs: number;
  recommended_sets: number;
  recommended_reps: number;
  reasoning: string | null;
  strength_exercises: {
    name: string;
    category: string;
    default_scheme: string;
  };
};

export default function StrengthNextWorkout() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("strength_recommendations")
        .select(
          "recommended_weight_lbs, recommended_sets, recommended_reps, reasoning, strength_exercises(name, category, default_scheme)",
        )
        .eq("user_id", userId);

      if (data) setRecs(data as unknown as Recommendation[]);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm text-muted">
        Loading recommendations...
      </div>
    );
  }

  if (recs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-white px-6 py-8 text-center">
          <p className="text-sm text-muted">
            No recommendations yet — log your first workout to get started!
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

  const categoryOrder = ["power", "squat", "push", "pull", "hinge", "accessory"];

  const sorted = [...recs].sort((a, b) => {
    const ai = categoryOrder.indexOf(a.strength_exercises.category);
    const bi = categoryOrder.indexOf(b.strength_exercises.category);
    return ai - bi;
  });

  return (
    <div className="space-y-4">
      {sorted.map((rec) => (
        <div
          key={rec.strength_exercises.name}
          className="rounded-2xl border border-border bg-white px-5 py-4"
        >
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-ink">
              {rec.strength_exercises.name}
            </h3>
            <span className="text-xs text-muted">
              {rec.strength_exercises.category}
            </span>
          </div>
          <p className="mt-1 text-lg font-semibold text-ink">
            {rec.recommended_sets} &times; {rec.recommended_reps} @{" "}
            {rec.recommended_weight_lbs} lbs
          </p>
          {rec.reasoning ? (
            <p className="mt-1 text-xs text-muted">{rec.reasoning}</p>
          ) : null}
        </div>
      ))}

      <Link
        href="/strength/log"
        className="mt-2 block w-full rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90"
      >
        Start Workout
      </Link>
    </div>
  );
}
