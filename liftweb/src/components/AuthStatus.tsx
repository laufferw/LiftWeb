"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type AuthState = {
  email: string | null;
  isLoading: boolean;
};

export default function AuthStatus() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    email: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (error) {
        setState({ email: null, isLoading: false });
        return;
      }
      setState({
        email: data.session?.user.email ?? null,
        isLoading: false,
      });
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          email: session?.user.email ?? null,
          isLoading: false,
        });
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (state.isLoading) {
    return (
      <span className="rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-muted">
        Loading
      </span>
    );
  }

  if (!state.email) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-semibold text-muted sm:inline">
        {state.email}
      </span>
      <button
        onClick={handleSignOut}
        className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/30"
        type="button"
      >
        Sign out
      </button>
    </div>
  );
}
