"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ProfileFormState = {
  handle: string;
  displayName: string;
};

export default function OnboardingForm() {
  const router = useRouter();
  const [state, setState] = useState<ProfileFormState>({
    handle: "",
    displayName: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const normalizedHandle = useMemo(
    () => state.handle.trim().toLowerCase(),
    [state.handle],
  );

  useEffect(() => {
    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (data?.id) {
        router.replace("/");
      }
    };

    loadProfile();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setStatus("error");
      setMessage("You need to be signed in to continue.");
      return;
    }

    const cleanedHandle = normalizedHandle.replace(/[^a-z0-9_]/g, "");
    if (cleanedHandle.length < 3) {
      setStatus("error");
      setMessage("Handle must be at least 3 characters.");
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      handle: cleanedHandle,
      display_name: state.displayName.trim(),
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    router.replace(`/u/${cleanedHandle}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
          Handle
        </label>
        <input
          type="text"
          value={state.handle}
          onChange={(event) =>
            setState((prev) => ({ ...prev, handle: event.target.value }))
          }
          placeholder="yourhandle"
          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
          required
        />
        <p className="mt-2 text-xs text-muted">
          Lowercase letters, numbers, and underscores only.
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
          Display name
        </label>
        <input
          type="text"
          value={state.displayName}
          onChange={(event) =>
            setState((prev) => ({ ...prev, displayName: event.target.value }))
          }
          placeholder="Your name"
          className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/40"
          required
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Saving..." : "Finish setup"}
      </button>

      {message ? (
        <p className="text-sm text-muted" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
