"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AppRole, MatchMode, MatchSummaryRow, UserSettingsRow } from "@/types/database.types";
import { ArchiveService, calculateFighterStatistics, type FighterStatistics } from "@/services/archive.service";

export interface AppUser {
  id: string;
  _id: string;
  name: string;
  email?: string;
  points: number;
  achievements: { _id: string; progress: number; unlocked: boolean }[];
  badges: { id: string; name: string; icon: string; rarity: string; progress: number }[];
  rankings: { mode: MatchMode | null; score: number; victories: number; defeats: number; draws: number; matches_played: number }[];
  roles: AppRole[];
  settings: UserSettingsRow | null;
  statistics: FighterStatistics;
  recentHistory: MatchSummaryRow[];
  club?: string;
  photo?: string | null;
  partage_donnees?: string;
}

type UserMode = "guest" | "authenticated";

interface UserModeContextType {
  mode: UserMode | null;
  setMode: (mode: UserMode) => void;
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  authLoading: boolean;
  authError: string | null;
  refreshUser: () => Promise<void>;
  fighterDirectory: { id: string; display_name: string }[];
  fighterDirectoryLoading: boolean;
  fighterId: (displayName: string) => string | undefined;
}

const UserModeContext = createContext<UserModeContextType | null>(null);

export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<UserMode | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [fighterDirectory, setFighterDirectory] = useState<{ id: string; display_name: string }[]>([]);
  const [fighterDirectoryLoading, setFighterDirectoryLoading] = useState(false);

  const loadProfile = useCallback(async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      setFighterDirectory([]);
      setAuthError(null);
      setUser(null);
      setMode((current) => (current === "guest" ? "guest" : null));
      setAuthLoading(false);
      return;
    }

    const supabase = createClient();
    setFighterDirectoryLoading(true);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name, avatar_path, share_data, club_id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError || !profile) {
      setUser(null);
      setMode(null);
      setAuthError("Le profil utilisateur n’a pas pu être chargé.");
      setAuthLoading(false);
      return;
    }

    const profileData = await Promise.all([
      new ArchiveService(supabase).fighterData(authUser.id),
      supabase.from("user_roles").select("role").eq("user_id", authUser.id),
      supabase.from("user_settings").select("*").eq("user_id", authUser.id).maybeSingle(),
      supabase.from("user_achievements").select("achievement_id, progress_snapshot").eq("user_id", authUser.id),
      supabase.rpc("achievement_catalog"),
      supabase.rpc("achievement_progress", { target_user_id: authUser.id }),
      supabase.from("user_badges").select("badge_id, progress").eq("user_id", authUser.id),
      supabase.from("badges").select("id, name, icon, rarity").eq("is_active", true),
      profile.club_id
        ? supabase.from("clubs").select("name").eq("id", profile.club_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.rpc("active_fighter_directory"),
    ]).catch(() => null);

    if (!profileData) {
      setUser(null);
      setMode(null);
      setAuthError("Les données du profil n’ont pas pu être chargées.");
      setAuthLoading(false);
      return;
    }

    const [
      fighterResult,
      { data: roles, error: rolesError },
      { data: settings, error: settingsError },
      { data: unlockedAchievements, error: achievementsError },
      { data: achievementCatalog, error: catalogError },
      { data: achievementProgressRows, error: progressError },
      { data: userBadges, error: badgesError },
      { data: badgeCatalog, error: badgeCatalogError },
      clubResult,
      { data: directory, error: directoryError },
    ] = profileData;

    setFighterDirectoryLoading(false);
    setFighterDirectory(directory ?? []);

    if (rolesError || settingsError || achievementsError || catalogError || progressError || badgesError || badgeCatalogError || directoryError) {
      setAuthError("Certaines données de progression n’ont pas pu être chargées.");
    } else {
      setAuthError(null);
    }

    const clubName = clubResult.data?.name;

    const photo = profile?.avatar_path
      ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_path).data.publicUrl
      : null;

    const rankings = fighterResult.rankings;
    const overall = rankings.find((ranking) => ranking.mode === null);
    const unlockedIds = new Set((unlockedAchievements ?? []).map((achievement) => achievement.achievement_id));
    const progressById = new Map((achievementProgressRows ?? []).map((progress) => [progress.achievement_id, progress.progress]));
    const achievementProgress = (achievementCatalog ?? []).map((achievement) => {
      const unlocked = unlockedIds.has(achievement.id);
      return { _id: achievement.id, progress: unlocked ? 100 : progressById.get(achievement.id) ?? 0, unlocked };
    });
    const badgeById = new Map((badgeCatalog ?? []).map((badge) => [badge.id, badge]));

    setUser({
      id: authUser.id,
      _id: authUser.id,
      name: profile?.display_name ?? String(authUser.user_metadata.display_name ?? authUser.email ?? "Membre"),
      email: authUser.email,
      points: overall?.score ?? 0,
      achievements: achievementProgress,
      badges: (userBadges ?? []).flatMap((userBadge) => {
        const badge = badgeById.get(userBadge.badge_id);
        return badge ? [{ ...badge, progress: userBadge.progress }] : [];
      }),
      rankings: rankings ?? [],
      roles: (roles ?? []).map((entry) => entry.role),
      settings,
      statistics: calculateFighterStatistics(fighterResult),
      recentHistory: fighterResult.summaries.slice(0, 5),
      club: clubName,
      photo,
      partage_donnees: profile?.share_data ? "true" : "false",
    });
    setMode("authenticated");
    setAuthLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await createClient().auth.getUser();
    await loadProfile(data.user);
  }, [loadProfile]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setUser(null);
        setMode(null);
        setAuthError("La session n’a pas pu être vérifiée.");
        setAuthLoading(false);
        return;
      }
      void loadProfile(data.user);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void loadProfile(session?.user ?? null), 0);
    });
    const handleDataRefresh = () => void refreshUser();
    window.addEventListener("csc:data-refresh", handleDataRefresh);

    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("csc:data-refresh", handleDataRefresh);
    };
  }, [loadProfile, refreshUser]);

  const contextValue = useMemo(
    () => ({ mode, setMode, user, setUser, authLoading, authError, refreshUser, fighterDirectory, fighterDirectoryLoading, fighterId: (displayName: string) => fighterDirectory.find((fighter) => fighter.display_name === displayName)?.id }),
    [mode, user, authLoading, authError, refreshUser, fighterDirectory, fighterDirectoryLoading],
  );

  return (
    <UserModeContext.Provider value={contextValue}>
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  const context = useContext(UserModeContext);
  if (!context) throw new Error("useUserMode must be used inside UserModeProvider");
  return context;
}
