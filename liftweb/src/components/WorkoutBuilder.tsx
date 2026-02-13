"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type LiftOption = {
  id: string;
  name: string;
};

type FormState = {
  name: string;
  selectedLiftIds: string[];
  mainLiftId: string | null;
};

export default function WorkoutBuilder() {
  const router = useRouter();
  const [lifts, setLifts] = useState<LiftOption[]>([]);
  const [state, setState] = useState<FormState>({
    name: "",
    selectedLiftIds: [],
    mainLiftId: null,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setLifts([]);
        return;
      }

      const { data } = await supabase
        .from("lifts")
        .select("id,name")
        .eq("user_id", userId)
        .order("name");

      setLifts((data ?? []) as LiftOption[]);
    };

    load();
  }, []);

  const canSave = useMemo(
    () => state.name.trim().length > 0 && state.selectedLiftIds.length > 0,
    [state.name, state.selectedLiftIds.length],
  );

  const toggleLift = (liftId: string) => {
    setState((prev) => {
      const exists = prev.selectedLiftIds.includes(liftId);
      const updated = exists
        ? prev.selectedLiftIds.filter((id) => id !== liftId)
        : [...prev.selectedLiftIds, liftId];

      const mainLiftId = updated.includes(prev.mainLiftId ?? "")
        ? prev.mainLiftId
        : null;

      return {
        ...prev,
        selectedLiftIds: updated,
        mainLiftId,
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setStatus("error");
      setMessage("Sign in to create a workout.");
      return;
    }

    const liftIds = Array.from(
      new Set(state.selectedLiftIds.filter((id) => Boolean(id))),
    );
    const mainLiftId = liftIds.includes(state.mainLiftId ?? "")
      ? state.mainLiftId
      : null;

    const { data, error } = await supabase
      .from("workout_templates")
      .insert({
        user_id: userId,
        name: state.name.trim(),
        lift_ids: liftIds,
        main_lift_id: mainLiftId,
      })
      .select("id")
      .single();

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push(`/workouts/${data.id}`);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Workout name
          </label>
          <input
            type="text"
            value={state.name}
            onChange={(event) =>
              setState((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Upper strength"
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Select lifts
            </label>
            <Link href="/lifts" className="text-xs font-semibold text-muted">
              Manage lifts
            </Link>
          </div>

          <div className="mt-3 grid gap-3">
            {lifts.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
                Add lifts before creating a workout.
              </div>
            ) : (
              lifts.map((lift) => {
                const selected = state.selectedLiftIds.includes(lift.id);
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

        {state.selectedLiftIds.length > 0 ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Main lift
            </label>
            <div className="mt-3 grid gap-3">
              {state.selectedLiftIds.map((liftId) => {
                const lift = lifts.find((item) => item.id === liftId);
                const isMain = state.mainLiftId === liftId;
                return (
                  <button
                    key={liftId}
                    type="button"
                    onClick={() =>
                      setState((prev) => ({ ...prev, mainLiftId: liftId }))
                    }
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
          type="submit"
          disabled={!canSave || status === "loading"}
          className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Saving..." : "Save workout"}
        </button>

        {message ? (
          <p className="text-sm text-muted" role="status">
            {message}{" "}
            {message.includes("Sign in") ? (
              <Link href="/login" className="font-semibold text-ink">
                Sign in
              </Link>
            ) : null}
          </p>
        ) : null}
      </form>
    </div>
  );
}
