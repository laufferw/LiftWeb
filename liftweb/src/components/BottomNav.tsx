"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function BottomNav() {
  const [profileHandle, setProfileHandle] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) {
        setProfileHandle(null);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", userId)
        .maybeSingle();

      setProfileHandle(profileData?.handle ?? null);
    };

    loadProfile();
  }, []);

  const navItems = useMemo(
    () => [
      { href: "/", label: "Feed" },
      { href: "/log/new", label: "Log" },
      { href: "/lifts", label: "Lifts" },
      { href: "/workouts", label: "Workouts" },
      { href: profileHandle ? `/u/${profileHandle}` : "/login", label: "Profile" },
    ],
    [profileHandle],
  );

  return (
    <nav className="fixed bottom-4 left-1/2 z-20 w-[min(92%,420px)] -translate-x-1/2 rounded-full border border-border bg-surface/95 px-4 py-2 shadow-card backdrop-blur">
      <ul className="flex items-center justify-between">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="rounded-full px-3 py-2 text-xs font-semibold text-muted transition hover:text-ink"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
