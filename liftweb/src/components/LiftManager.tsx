"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type LiftFormState = {
  name: string;
  goalWeight: string;
  weekNumber: string;
  topSetStartPercent: string;
  backoffPercent: string;
  cycleStartWeight: string;
  topSetSets: string;
  topSetReps: string;
  backoffSets: string;
  backoffReps: string;
  altTopSetSets: string;
  altTopSetReps: string;
  altBackoffSets: string;
  altBackoffReps: string;
  altDayTopSetPercent: string;
  altDayBackoffPercent: string;
};

type LiftRow = {
  id: string;
  name: string;
  goal_weight: number;
  week_number: number;
  top_set_start_percent: number;
  backoff_percent: number;
  cycle_start_weight: number;
  top_set_sets: number;
  top_set_reps: number;
  backoff_sets: number;
  backoff_reps: number;
  alt_top_set_sets: number;
  alt_top_set_reps: number;
  alt_backoff_sets: number;
  alt_backoff_reps: number;
  alt_day_top_set_percent: number;
  alt_day_backoff_percent: number;
};

const initialState: LiftFormState = {
  name: "",
  goalWeight: "225",
  weekNumber: "1",
  topSetStartPercent: "0.7",
  backoffPercent: "0.6",
  cycleStartWeight: "135",
  topSetSets: "3",
  topSetReps: "5",
  backoffSets: "2",
  backoffReps: "8",
  altTopSetSets: "3",
  altTopSetReps: "10",
  altBackoffSets: "2",
  altBackoffReps: "12",
  altDayTopSetPercent: "0.7",
  altDayBackoffPercent: "0.6",
};

const roundToNearestFive = (value: number) => Math.round(value / 5) * 5;

export default function LiftManager() {
  const [state, setState] = useState<LiftFormState>(initialState);
  const [lifts, setLifts] = useState<LiftRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [editingLiftId, setEditingLiftId] = useState<string | null>(null);
  const [editState, setEditState] = useState<LiftFormState>(initialState);
  const [editStatus, setEditStatus] = useState<"idle" | "loading" | "error">("idle");
  const [editMessage, setEditMessage] = useState<string | null>(null);

  const updateField = (field: keyof LiftFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const loadLifts = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setLifts([]);
      return;
    }

    const { data } = await supabase
      .from("lifts")
      .select(
        "id,name,goal_weight,week_number,top_set_start_percent,backoff_percent,cycle_start_weight,top_set_sets,top_set_reps,backoff_sets,backoff_reps,alt_top_set_sets,alt_top_set_reps,alt_backoff_sets,alt_backoff_reps,alt_day_top_set_percent,alt_day_backoff_percent",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setLifts((data ?? []) as LiftRow[]);
  };

  useEffect(() => {
    loadLifts();
  }, []);

  const canSave = useMemo(() => state.name.trim().length > 0, [state.name]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setStatus("error");
      setMessage("Sign in to add lifts.");
      return;
    }

    const toNumber = (value: string) => Number(value);
    const payload = {
      user_id: userId,
      name: state.name.trim(),
      goal_weight: toNumber(state.goalWeight),
      week_number: toNumber(state.weekNumber),
      top_set_start_percent: toNumber(state.topSetStartPercent),
      backoff_percent: toNumber(state.backoffPercent),
      cycle_start_weight: toNumber(state.cycleStartWeight),
      top_set_sets: toNumber(state.topSetSets),
      top_set_reps: toNumber(state.topSetReps),
      backoff_sets: toNumber(state.backoffSets),
      backoff_reps: toNumber(state.backoffReps),
      alt_top_set_sets: toNumber(state.altTopSetSets),
      alt_top_set_reps: toNumber(state.altTopSetReps),
      alt_backoff_sets: toNumber(state.altBackoffSets),
      alt_backoff_reps: toNumber(state.altBackoffReps),
      alt_day_top_set_percent: toNumber(state.altDayTopSetPercent),
      alt_day_backoff_percent: toNumber(state.altDayBackoffPercent),
    };

    if (Object.values(payload).some((value) => Number.isNaN(value as number))) {
      setStatus("error");
      setMessage("All numeric fields must be valid numbers.");
      return;
    }

    const { error } = await supabase.from("lifts").insert(payload);
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("idle");
    setMessage("Lift added.");
    setState(initialState);
    await loadLifts();
  };

  const handleDelete = async (liftId: string) => {
    await supabase.from("lifts").delete().eq("id", liftId);
    await loadLifts();
  };

  const startEdit = (lift: LiftRow) => {
    setEditingLiftId(lift.id);
    setEditMessage(null);
    setEditState({
      name: lift.name,
      goalWeight: String(lift.goal_weight),
      weekNumber: String(lift.week_number),
      topSetStartPercent: String(lift.top_set_start_percent),
      backoffPercent: String(lift.backoff_percent),
      cycleStartWeight: String(lift.cycle_start_weight),
      topSetSets: String(lift.top_set_sets),
      topSetReps: String(lift.top_set_reps),
      backoffSets: String(lift.backoff_sets),
      backoffReps: String(lift.backoff_reps),
      altTopSetSets: String(lift.alt_top_set_sets),
      altTopSetReps: String(lift.alt_top_set_reps),
      altBackoffSets: String(lift.alt_backoff_sets),
      altBackoffReps: String(lift.alt_backoff_reps),
      altDayTopSetPercent: String(lift.alt_day_top_set_percent),
      altDayBackoffPercent: String(lift.alt_day_backoff_percent),
    });
  };

  const updateEditField = (field: keyof LiftFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setEditState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleUpdate = async () => {
    if (!editingLiftId) return;
    setEditStatus("loading");
    setEditMessage(null);

    if (!editState.name.trim()) {
      setEditStatus("error");
      setEditMessage("Lift name is required.");
      return;
    }

    const toNumber = (value: string) => Number(value);
    const payload = {
      name: editState.name.trim(),
      goal_weight: toNumber(editState.goalWeight),
      week_number: toNumber(editState.weekNumber),
      top_set_start_percent: toNumber(editState.topSetStartPercent),
      backoff_percent: toNumber(editState.backoffPercent),
      cycle_start_weight: toNumber(editState.cycleStartWeight),
      top_set_sets: toNumber(editState.topSetSets),
      top_set_reps: toNumber(editState.topSetReps),
      backoff_sets: toNumber(editState.backoffSets),
      backoff_reps: toNumber(editState.backoffReps),
      alt_top_set_sets: toNumber(editState.altTopSetSets),
      alt_top_set_reps: toNumber(editState.altTopSetReps),
      alt_backoff_sets: toNumber(editState.altBackoffSets),
      alt_backoff_reps: toNumber(editState.altBackoffReps),
      alt_day_top_set_percent: toNumber(editState.altDayTopSetPercent),
      alt_day_backoff_percent: toNumber(editState.altDayBackoffPercent),
    };

    if (Object.values(payload).some((value) => Number.isNaN(value as number))) {
      setEditStatus("error");
      setEditMessage("All numeric fields must be valid numbers.");
      return;
    }

    const { error } = await supabase
      .from("lifts")
      .update(payload)
      .eq("id", editingLiftId);

    if (error) {
      setEditStatus("error");
      setEditMessage(error.message);
      return;
    }

    setEditStatus("idle");
    setEditMessage("Lift updated.");
    setEditingLiftId(null);
    await loadLifts();
  };

  const computePreview = (lift: LiftRow) => {
    const topSetWeight = roundToNearestFive(
      lift.cycle_start_weight + (lift.week_number - 1) * 5,
    );
    const backoffWeight = roundToNearestFive(topSetWeight * lift.backoff_percent);
    const altTopWeight = roundToNearestFive(
      lift.goal_weight * 0.95 * lift.alt_day_top_set_percent,
    );
    const altBackoffWeight = roundToNearestFive(
      lift.goal_weight * 0.95 * lift.alt_day_backoff_percent,
    );

    return {
      topSetWeight,
      backoffWeight,
      altTopWeight,
      altBackoffWeight,
    };
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Lift name
          </label>
          <input
            type="text"
            value={state.name}
            onChange={updateField("name")}
            placeholder="Bench press"
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Goal weight
            </label>
            <input
              type="number"
              value={state.goalWeight}
              onChange={updateField("goalWeight")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Week number
            </label>
            <input
              type="number"
              value={state.weekNumber}
              onChange={updateField("weekNumber")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Top set start %
            </label>
            <input
              type="number"
              step="0.01"
              value={state.topSetStartPercent}
              onChange={updateField("topSetStartPercent")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Back-off %
            </label>
            <input
              type="number"
              step="0.01"
              value={state.backoffPercent}
              onChange={updateField("backoffPercent")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Cycle start weight
          </label>
          <input
            type="number"
            value={state.cycleStartWeight}
            onChange={updateField("cycleStartWeight")}
            className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Top set sets
            </label>
            <input
              type="number"
              value={state.topSetSets}
              onChange={updateField("topSetSets")}
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
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Back-off sets
            </label>
            <input
              type="number"
              value={state.backoffSets}
              onChange={updateField("backoffSets")}
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
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Alt top set sets
            </label>
            <input
              type="number"
              value={state.altTopSetSets}
              onChange={updateField("altTopSetSets")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Alt top set reps
            </label>
            <input
              type="number"
              value={state.altTopSetReps}
              onChange={updateField("altTopSetReps")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Alt back-off sets
            </label>
            <input
              type="number"
              value={state.altBackoffSets}
              onChange={updateField("altBackoffSets")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Alt back-off reps
            </label>
            <input
              type="number"
              value={state.altBackoffReps}
              onChange={updateField("altBackoffReps")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Alt day top %
            </label>
            <input
              type="number"
              step="0.01"
              value={state.altDayTopSetPercent}
              onChange={updateField("altDayTopSetPercent")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              Alt day back-off %
            </label>
            <input
              type="number"
              step="0.01"
              value={state.altDayBackoffPercent}
              onChange={updateField("altDayBackoffPercent")}
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSave || status === "loading"}
          className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Saving..." : "Add lift"}
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

      <div className="space-y-4">
        {lifts.length === 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
            No lifts yet. Add one above.
          </div>
        ) : (
          lifts.map((lift) => {
            const preview = computePreview(lift);
            return (
              <div
                key={lift.id}
                className="rounded-3xl border border-border bg-surface p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{lift.name}</h3>
                    <p className="text-xs text-muted">Week {lift.week_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        editingLiftId === lift.id
                          ? setEditingLiftId(null)
                          : startEdit(lift)
                      }
                      className="text-xs font-semibold text-muted transition hover:text-ink"
                    >
                      {editingLiftId === lift.id ? "Cancel" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(lift.id)}
                      className="text-xs font-semibold text-muted transition hover:text-ink"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-base/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                      Main day
                    </p>
                    <p className="mt-2 text-sm text-ink">
                      {preview.topSetWeight} lbs · {lift.top_set_sets}x{lift.top_set_reps}
                    </p>
                    <p className="text-sm text-muted">
                      Back-off {preview.backoffWeight} lbs · {lift.backoff_sets}x{lift.backoff_reps}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-base/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                      Alt day
                    </p>
                    <p className="mt-2 text-sm text-ink">
                      {preview.altTopWeight} lbs · {lift.alt_top_set_sets}x{lift.alt_top_set_reps}
                    </p>
                    <p className="text-sm text-muted">
                      Back-off {preview.altBackoffWeight} lbs · {lift.alt_backoff_sets}x{lift.alt_backoff_reps}
                    </p>
                  </div>
                </div>

                {editingLiftId === lift.id ? (
                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                        Lift name
                      </label>
                      <input
                        type="text"
                        value={editState.name}
                        onChange={updateEditField("name")}
                        className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Goal weight
                        </label>
                        <input
                          type="number"
                          value={editState.goalWeight}
                          onChange={updateEditField("goalWeight")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Week number
                        </label>
                        <input
                          type="number"
                          value={editState.weekNumber}
                          onChange={updateEditField("weekNumber")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Top set start %
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editState.topSetStartPercent}
                          onChange={updateEditField("topSetStartPercent")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Back-off %
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editState.backoffPercent}
                          onChange={updateEditField("backoffPercent")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                        Cycle start weight
                      </label>
                      <input
                        type="number"
                        value={editState.cycleStartWeight}
                        onChange={updateEditField("cycleStartWeight")}
                        className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Top set sets
                        </label>
                        <input
                          type="number"
                          value={editState.topSetSets}
                          onChange={updateEditField("topSetSets")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Top set reps
                        </label>
                        <input
                          type="number"
                          value={editState.topSetReps}
                          onChange={updateEditField("topSetReps")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Back-off sets
                        </label>
                        <input
                          type="number"
                          value={editState.backoffSets}
                          onChange={updateEditField("backoffSets")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Back-off reps
                        </label>
                        <input
                          type="number"
                          value={editState.backoffReps}
                          onChange={updateEditField("backoffReps")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Alt top sets
                        </label>
                        <input
                          type="number"
                          value={editState.altTopSetSets}
                          onChange={updateEditField("altTopSetSets")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Alt top reps
                        </label>
                        <input
                          type="number"
                          value={editState.altTopSetReps}
                          onChange={updateEditField("altTopSetReps")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Alt back-off sets
                        </label>
                        <input
                          type="number"
                          value={editState.altBackoffSets}
                          onChange={updateEditField("altBackoffSets")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Alt back-off reps
                        </label>
                        <input
                          type="number"
                          value={editState.altBackoffReps}
                          onChange={updateEditField("altBackoffReps")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Alt day top %
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editState.altDayTopSetPercent}
                          onChange={updateEditField("altDayTopSetPercent")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                          Alt day back-off %
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editState.altDayBackoffPercent}
                          onChange={updateEditField("altDayBackoffPercent")}
                          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={editStatus === "loading"}
                      className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {editStatus === "loading" ? "Saving..." : "Save changes"}
                    </button>

                    {editMessage ? (
                      <p className="text-sm text-muted" role="status">
                        {editMessage}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
