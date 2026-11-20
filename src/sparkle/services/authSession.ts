import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// One shared Lovable Cloud auth listener for the whole Sparkle app; components read it via useAuthSession().
let currentSession: Session | null = null;
let started = false;
const listeners = new Set<() => void>();

function start() {
  if (started) return;
  started = true;
  void supabase.auth.getSession().then(({ data }) => {
    currentSession = data.session;
    listeners.forEach((l) => l());
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") return;
    currentSession = session;
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAuthSession(): Session | null {
  return useSyncExternalStore(
    subscribe,
    () => currentSession,
    () => null,
  );
}

export function getAccountLabel(session: Session | null): string | null {
  if (!session) return null;
  const meta = session.user.user_metadata as Record<string, unknown> | undefined;
  const name = meta?.["display_name"] ?? meta?.["full_name"] ?? meta?.["name"];
  return (typeof name === "string" && name.trim()) || session.user.email || "Account";
}

export async function signOutOfSparkle() {
  await supabase.auth.signOut();
}
