export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "member" | "moderator" | "admin";
export type MatchMode = "duel" | "official_duel" | "handicap" | "tournament" | "highlander" | "battle_royale";
export type MatchStatus = "draft" | "active" | "completed" | "cancelled";
export type MatchResultType = "health" | "points" | "time" | "disqualification" | "draw" | "forfeit" | "other";

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: [];
};

export interface ClubRow {
  id: string; slug: string; name: string; normalized_name: string; description: string | null;
  city: string | null; department_code: string | null; region: string | null; country_code: string;
  website_url: string | null; logo_path: string | null; is_verified: boolean; created_at: string; updated_at: string;
}
export type ClubInsert = Omit<ClubRow, "id" | "normalized_name" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };

export interface ProfileRow {
  id: string; display_name: string; normalized_display_name: string; club_id: string | null; bio: string | null;
  avatar_path: string | null; share_data: boolean; status: "pending" | "active" | "suspended" | "rejected" | "deleted";
  onboarding_completed: boolean; last_active_at: string | null; created_at: string; updated_at: string;
}
export type ProfileInsert = Omit<ProfileRow, "normalized_display_name" | "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };

export interface RarityRow {
  id: string; legacy_mongo_id: string | null; code: string; name: string; category: string; description: string | null;
  sort_order: number; color_hex: string | null; created_at: string; updated_at: string;
}
export type RarityInsert = Omit<RarityRow, "id" | "legacy_mongo_id" | "created_at" | "updated_at"> & { id?: string; legacy_mongo_id?: string | null; created_at?: string; updated_at?: string };

export interface AchievementRow {
  id: string; legacy_mongo_id: string | null; code: string; name: string; description: string;
  condition_type: "victories" | "matches" | "win_streak" | "perfect_games" | "score" | "custom";
  condition_value: number | null; condition_metadata: Json; icon: string; badge_label: string | null;
  points_reward: number; is_active: boolean; is_secret: boolean; created_at: string; updated_at: string;
}
export type AchievementRule =
  | { metric: string; operator?: "gte" | "gt" | "lte" | "lt" | "eq" | "neq"; value: number }
  | { combinator?: "all" | "any"; rules: AchievementRule[] };
export type AchievementMetricDefinitionRow = { metric_path: string; label: string; value_type: "number" | "text" | "boolean"; description: string | null; is_active: boolean; created_at: string };
export type AchievementInsert = Omit<AchievementRow, "id" | "legacy_mongo_id" | "created_at" | "updated_at"> & { id?: string; legacy_mongo_id?: string | null; created_at?: string; updated_at?: string };

export interface RankingRow {
  id: string; user_id: string; mode: MatchMode | null; score: number; victories: number; defeats: number; draws: number;
  matches_played: number; current_win_streak: number; longest_win_streak: number; perfect_games: number;
  last_match_at: string | null; created_at: string; updated_at: string;
}
export type RankingInsert = Omit<RankingRow, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string };

export interface MatchRow {
  id: string; legacy_mongo_id: string | null; public_id: number; created_by: string; tournament_id: string | null;
  mode: MatchMode; status: MatchStatus; result_type: MatchResultType | null; winner_participant_id: string | null;
  event_name: string | null; referee_id: string | null; round_number: number | null; bracket_position: number | null;
  scheduled_at: string | null; started_at: string | null; ended_at: string | null; duration_seconds: number | null;
  max_duration_seconds: number | null; verification_hash: string | null; rules_version: string; settings: Json; metadata: Json;
  created_at: string; updated_at: string;
}
export type MatchInsert = Omit<MatchRow, "id" | "public_id" | "legacy_mongo_id" | "created_at" | "updated_at"> & { id?: string; legacy_mongo_id?: string | null; public_id?: number; created_at?: string; updated_at?: string };

export interface MatchParticipantRow {
  id: string; match_id: string; user_id: string | null; tournament_participant_id: string | null;
  display_name_snapshot: string; position: number; team: number | null; starting_health: number | null;
  final_health: number | null; score: number; placement: number | null; is_winner: boolean; is_disqualified: boolean;
  stats: Json; created_at: string;
}
export type MatchParticipantInsert = Omit<MatchParticipantRow, "id" | "created_at"> & { id?: string; created_at?: string };

export type UserRoleRow = { user_id: string; role: AppRole; granted_by: string | null; granted_at: string };

export type AchievementRarityRow = { achievement_id: string; rarity_id: string };
export type UserSettingsRow = { user_id: string; sound_enabled: boolean; vibration_enabled: boolean; theme: "dark" | "light" | "cyber"; language: "fr" | "en"; auto_save: boolean; show_tutorial: boolean; created_at: string; updated_at: string };
export type UserAchievementRow = { user_id: string; achievement_id: string; unlocked_at: string; source_match_id: string | null; progress_snapshot: Json };
export type AchievementProgressRow = { achievement_id: string; current_value: number | null; target_value: number | null; progress: number; eligible: boolean };
export type BadgeRow = { id: string; code: string; name: string; description: string; icon: string; rarity: "common" | "rare" | "epic" | "legendary"; category: string; is_active: boolean; created_at: string; updated_at: string };
export type UserBadgeRow = { user_id: string; badge_id: string; unlocked_at: string; progress: number; metadata: Json };
export type TournamentRow = { id: string; created_by: string; club_id: string | null; name: string; description: string | null; type: "single_elimination" | "round_robin"; status: "draft" | "registration" | "active" | "completed" | "cancelled"; game_mode: MatchMode; match_duration_seconds: number | null; max_participants: number; starts_at: string | null; ended_at: string | null; settings: Json; created_at: string; updated_at: string };
export type TournamentParticipantRow = { id: string; tournament_id: string; user_id: string | null; display_name_snapshot: string; seed: number | null; final_rank: number | null; status: "registered" | "active" | "eliminated" | "withdrawn" | "winner"; registered_at: string; metadata: Json };
export type MatchFaultRow = { id: string; match_id: string; participant_id: string; assigned_by: string | null; type: "yellow" | "red" | "black"; reason_code: string; reason_label: string; penalty: "warning" | "health" | "points" | "disqualification"; health_delta: number; score_delta: number; occurred_at: string; round_number: number | null; metadata: Json };
export type MatchEventRow = { id: number; match_id: string; actor_id: string | null; participant_id: string | null; event_type: string; payload: Json; occurred_at: string };
export type RoleAuditRow = { id: number; target_user_id: string; role: AppRole; action: "grant" | "revoke"; actor_id: string | null; occurred_at: string };
export type EmailOutboxRow = { id: number; user_id: string; template: "registration_pending" | "account_activated" | "account_rejected" | "account_suspended"; payload: Json; created_at: string; sent_at: string | null; last_error: string | null };
export type PublicProfileRow = { id: string; display_name: string; club_id: string | null; club_name: string | null; bio: string | null; avatar_path: string | null; last_active_at: string | null; created_at: string };
export type LeaderboardRow = { user_id: string; display_name: string; club_id: string | null; club_name: string | null; mode: MatchMode | null; score: number; victories: number; defeats: number; draws: number; matches_played: number; win_rate: number; longest_win_streak: number; perfect_games: number; last_match_at: string | null; rank_position: number };
export type MatchSummaryRow = { id: string; public_id: number; mode: MatchMode; status: MatchStatus; result_type: MatchResultType | null; tournament_id: string | null; event_name: string | null; started_at: string | null; ended_at: string | null; duration_seconds: number | null; rules_version: string; participants: Json };
export type UserStatisticsRow = { user_id: string; display_name: string; matches_played: number; victories: number; draws: number; defeats: number; last_match_at: string | null };

export type Database = {
  public: {
    Tables: {
      clubs: Table<ClubRow, ClubInsert>;
      profiles: Table<ProfileRow, ProfileInsert>;
      rarities: Table<RarityRow, RarityInsert>;
      achievements: Table<AchievementRow, AchievementInsert>;
      achievement_metric_definitions: Table<AchievementMetricDefinitionRow, Omit<AchievementMetricDefinitionRow, "created_at">>;
      achievement_rarities: Table<AchievementRarityRow, AchievementRarityRow>;
      rankings: Table<RankingRow, RankingInsert>;
      matches: Table<MatchRow, MatchInsert>;
      match_participants: Table<MatchParticipantRow, MatchParticipantInsert>;
      user_roles: Table<UserRoleRow, UserRoleRow>;
      user_settings: Table<UserSettingsRow, UserSettingsRow>;
      user_achievements: Table<UserAchievementRow, UserAchievementRow>;
      badges: Table<BadgeRow, Omit<BadgeRow, "id" | "created_at" | "updated_at">>;
      user_badges: Table<UserBadgeRow, UserBadgeRow>;
      tournaments: Table<TournamentRow, Omit<TournamentRow, "id" | "created_at" | "updated_at">>;
      tournament_participants: Table<TournamentParticipantRow, Omit<TournamentParticipantRow, "id" | "registered_at">>;
      match_faults: Table<MatchFaultRow, Omit<MatchFaultRow, "id" | "occurred_at">>;
      match_events: Table<MatchEventRow, Omit<MatchEventRow, "id" | "occurred_at">>;
      role_audit_log: Table<RoleAuditRow, Omit<RoleAuditRow, "id" | "occurred_at">>;
      email_outbox: Table<EmailOutboxRow, Omit<EmailOutboxRow, "id" | "created_at">>;
    };
    Views: {
      public_profiles: { Row: PublicProfileRow; Relationships: [] };
      leaderboard: { Row: LeaderboardRow; Relationships: [] };
      match_summaries: { Row: MatchSummaryRow; Relationships: [] };
      user_statistics: { Row: UserStatisticsRow; Relationships: [] };
    };
    Functions: {
      complete_match: {
        Args: { target_match_id: string; target_result_type: MatchResultType; target_winner_participant_id?: string | null; target_ended_at?: string };
        Returns: MatchRow;
      };
      evaluate_achievements: { Args: { target_user_id: string }; Returns: AchievementRow[] };
      start_match: { Args: { target_mode: MatchMode; target_participants: Json; target_max_duration_seconds?: number | null; target_event_name?: string | null; target_tournament_id?: string | null; target_client_session_id?: string; target_settings?: Json }; Returns: Json };
      record_match_event: { Args: { target_match_id: string; target_participant_id: string; target_event_type: string; target_payload?: Json; target_final_health?: number | null; target_score?: number | null }; Returns: MatchParticipantRow };
      record_match_fault: { Args: { target_match_id: string; target_participant_id: string; target_type: "yellow" | "red" | "black"; target_reason_code: string; target_reason_label: string; target_penalty: "warning" | "health" | "points" | "disqualification"; target_health_delta?: number; target_score_delta?: number }; Returns: MatchFaultRow };
      finish_match: { Args: { target_match_id: string; target_result_type: MatchResultType; target_winner_participant_id?: string | null }; Returns: Json };
      achievement_catalog: { Args: Record<string, never>; Returns: AchievementRow[] };
      achievement_progress: { Args: { target_user_id: string }; Returns: AchievementProgressRow[] };
      create_tournament_workflow: { Args: { target_name: string; target_type: "single_elimination" | "round_robin"; target_game_mode: MatchMode; target_duration_seconds: number; target_participants: Json; target_workflow: Json }; Returns: Json };
      save_tournament_progress: { Args: { target_tournament_id: string; target_workflow: Json; target_round: number; target_position: number; target_player_one_key: string; target_player_two_key: string; target_winner_key: string; target_score_one?: number; target_score_two?: number }; Returns: Json };
      set_profile_status: { Args: { target_user_id: string; target_status: string }; Returns: ProfileRow };
      grant_app_role: { Args: { target_user_id: string; target_role: AppRole }; Returns: undefined };
      revoke_app_role: { Args: { target_user_id: string; target_role: AppRole }; Returns: undefined };
    };
    Enums: {
      app_role: AppRole;
      match_mode: MatchMode;
      match_status: MatchStatus;
      match_result_type: MatchResultType;
    };
    CompositeTypes: Record<string, never>;
  };
};
