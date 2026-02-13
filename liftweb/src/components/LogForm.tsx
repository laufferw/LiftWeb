"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type LogFormState = {
  liftName: string;
  topSetWeight: string;
  topSetReps: string;
  backoffWeight: string;
  backoffReps: string;
  notes: string;
  tags: string;
};

const initialState: LogFormState = {
  liftName: "",
  topSetWeight: "",
  topSetReps: "",
  backoffWeight: "",
  backoffReps: "",
  notes: "",
  tags: "",
};

export default function LogForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<LogFormState>(initialState);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const templateId = searchParams.get("template");
    if (!templateId) return;

    const loadTemplate = async () => {
      const { data: templateData } = await supabase
        .from("workout_templates")
        .select("id,main_lift_id,lift_ids")
        .eq("id", templateId)
        .maybeSingle();

      if (!templateData) return;

      const preferredLiftId = templateData.main_lift_id ?? templateData.lift_ids[0];
      if (!preferredLiftId) return;

      const { data: liftData } = await supabase
        .from("lifts")
        .select(
          "name,cycle_start_weight,week_number,backoff_percent,top_set_sets,top_set_reps,backoff_sets,backoff_reps",
        )
        .eq("id", preferredLiftId)
        .maybeSingle();

      if (!liftData) return;

      const topSetWeight = Math.round(
        (liftData.cycle_start_weight + (liftData.week_number - 1) * 5) / 5,
      ) * 5;
      const backoffWeight = Math.round(
        (topSetWeight * liftData.backoff_percent) / 5,
      ) * 5;

      setState((prev) => ({
        ...prev,
        liftName: prev.liftName || liftData.name,
        topSetWeight: prev.topSetWeight || String(topSetWeight),
        topSetReps: prev.topSetReps || String(liftData.top_set_reps),
        backoffWeight: prev.backoffWeight || String(backoffWeight),
        backoffReps: prev.backoffReps || String(liftData.backoff_reps),
      }));
    };

    loadTemplate();
  }, [searchParams]);

  const updateField = (field: keyof LogFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setStatus("error");
      setMessage("You need to sign in to log a workout.");
      return;
    }

    const topWeight = Number(state.topSetWeight);
    const topReps = Number(state.topSetReps);
    const backWeight = Number(state.backoffWeight);
    const backReps = Number(state.backoffReps);

    if (!state.liftName.trim()) {
      setStatus("error");
      setMessage("Lift name is required.");
      return;
    }

    if ([topWeight, topReps, backWeight, backReps].some((value) => Number.isNaN(value))) {
      setStatus("error");
      setMessage("Weights and reps must be valid numbers.");
      return;
    }

    const tags = state.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("workout_logs")
      .insert({
        user_id: user.id,
        lift_name: state.liftName.trim(),
        top_set_weight: topWeight,
        top_set_reps: topReps,
        backoff_weight: backWeight,
        backoff_reps: backReps,
        notes: state.notes.trim(),
        tags,
      })
      .select("id")
      .single();

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.push(`/log/${data.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
          Lift name
        </label>
        <input
          type="text"
          value={state.liftName}
          onChange={updateField("liftName")}
          placeholder="Bench press"
          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Top set weight
          </label>
          <input
            type="number"
            value={state.topSetWeight}
            onChange={updateField("topSetWeight")}
            placeholder="205"
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Top set reps
          </label>
          <input
            type="number"
            value={state.topSetReps}
            onChange={updateField("topSetReps")}
            placeholder="5"
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Back-off weight
          </label>
          <input
            type="number"
            value={state.backoffWeight}
            onChange={updateField("backoffWeight")}
            placeholder="175"
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Back-off reps
          </label>
          <input
            type="number"
            value={state.backoffReps}
            onChange={updateField("backoffReps")}
            placeholder="8"
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
          Notes
        </label>
        <textarea
          value={state.notes}
          onChange={updateField("notes")}
          placeholder="How did it feel?"
          className="mt-2 min-h-[120px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
          Tags
        </label>
        <input
          type="text"
          value={state.tags}
          onChange={updateField("tags")}
          placeholder="strength, week1"
          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
        />
        <p className="mt-2 text-xs text-muted">Comma separate tags.</p>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Saving..." : "Publish log"}
      </button>

      {message ? (
        <p className="text-sm text-muted" role="status">
          {message}{" "}
          {message.includes("sign in") ? (
            <Link href="/login" className="font-semibold text-ink">
              Sign in
            </Link>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
