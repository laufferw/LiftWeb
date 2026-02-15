"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

type FeatureGateProps = {
  children: ReactNode;
  requireAuth?: boolean;
  requireProfile?: boolean;
  title?: string;
};

export default function FeatureGate({
  children,
  requireAuth = false,
  requireProfile = false,
  title = "This feature is locked",
}: FeatureGateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setIsSignedIn(false);
        setIsLoading(false);
        return;
      }

      setIsSignedIn(true);

      if (!requireProfile) {
        setIsLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      setHasProfile(Boolean(profileData?.id));
      setIsLoading(false);
    };

    void load();
  }, [requireProfile]);

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        <p className="font-semibold text-ink">Supabase is not configured.</p>
        <p className="mt-2">Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code> to enable this feature.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        Checking access...
      </div>
    );
  }

  if (requireAuth && !isSignedIn) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-2">Sign in to continue.</p>
        <Link href="/login" className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white">
          Go to sign in
        </Link>
      </div>
    );
  }

  if (requireProfile && !hasProfile) {
    return (
      <div className="rounded-3xl border border-border bg-surface p-6 text-sm text-muted shadow-card">
        <p className="font-semibold text-ink">Finish profile setup first.</p>
        <p className="mt-2">Create your handle before using this feature.</p>
        <Link href="/onboarding" className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white">
          Complete onboarding
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
