export interface Player {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  score: number;
  faults: Fault[];
  stats: PlayerStats;
  ranking: PlayerRanking;
  achievements: string[];
  tournamentStats: TournamentStats;
  createdAt: string;
  lastActive: string;
}

export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  averageDamagePerMatch: number;
  longestWinStreak: number;
  currentWinStreak: number;
  longestLossStreak: number;
  perfectGames: number;
  comebackWins: number;
}

export interface PlayerRanking {
  rank: string;
  level: number;
  points: number;
  badges: string[];
  titles: string[];
}

export interface TournamentStats {
  participated: number;
  won: number;
  finals: number;
  semifinals: number;
  quarterFinals: number;
  bestRanking: number;
}

export interface Fault {
  id: string;
  type: 'yellow' | 'red';
  reason: string;
  timestamp: number;
  round?: number;
}

export interface GameState {
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  totalTime: number;
  currentRound: number;
  maxRounds: number;
  player1: Player;
  player2: Player;
  mode: GameMode;
  settings: GameSettings;
  tournament?: Tournament;
  highlander?: HighlanderState;
  battleRoyale?: BattleRoyaleState;
  history: GameEvent[];
}

export interface GameSettings {
  enableFaults: boolean;
  enableRounds: boolean;
  roundDuration: number;
  breakDuration: number;
  maxHealth: number;
  winCondition: 'health' | 'score' | 'time';
  scoreToWin: number;
  enableHandicap: boolean;
  handicapSettings?: HandicapSettings;
}

export interface HandicapSettings {
  player1Handicap: number;
  player2Handicap: number;
  healthModifier: number;
  damageModifier: number;
}

export interface Tournament {
  id: string;
  name: string;
  type: 'elimination' | 'round_robin';
  players: string[];
  matches: TournamentMatch[];
  currentMatch?: string;
  winner?: string;
  status: 'setup' | 'active' | 'completed';
  matchDuration: number;
  maxPlayers: number;
  createdAt: string;
}

export interface TournamentMatch {
  id: string;
  player1: string;
  player2: string;
  winner?: string;
  round: number;
  position: number;
  completed: boolean;
  score?: { player1: number; player2: number };
}

export interface HighlanderState {
  champion: string;
  challengers: string[];
  currentChallenger: number;
  championWins: number;
  healingAmount: number;
  matchDuration: number;
  isComplete: boolean;
}

export interface BattleRoyaleState {
  players: string[];
  eliminatedPlayers: string[];
  currentPlayers: string[];
  shrinkTimer: number;
  shrinkInterval: number;
  damagePerTick: number;
  isComplete: boolean;
}

export type GameEventData =
  | { damage: { playerId: string; amount: number } }
  | { fault: Fault }
  | { roundEnd: { roundNumber: number } }
  | { gameEnd: { winner: string } }
  | { pause: unknown }
| { resume: unknown }

export interface GameEvent {
  id: string;
  type: 'damage' | 'fault' | 'round_end' | 'game_end' | 'pause' | 'resume';
  timestamp: number;
  data: GameEventData;
  description: string;
}

export type GameMode = 
  | 'duel' 
  | 'official' 
  | 'handicap' 
  | 'tournament' 
  | 'highlander' 
  | 'battle_royale';

export interface DatabaseState {
  players: Player[];
  matches: MatchRecord[];
  tournaments: Tournament[];
  settings: AppSettings;
}

export interface MatchRecord {
  id: string;
  player1: string;
  player2: string;
  winner: string;
  mode: GameMode;
  duration: number;
  finalScore: { player1: number; player2: number };
  faults: { player1: Fault[]; player2: Fault[] };
  timestamp: string;
  tournamentId?: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'dark' | 'light' | 'cyber';
  language: 'fr' | 'en';
  autoSave: boolean;
  showTutorial: boolean;
}

// Actions pour le reducer
export type GameAction =
  | { type: 'START_GAME'; payload: { mode: GameMode; settings: GameSettings } }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'SET_PLAYERS'; payload: { player1Name: string; player2Name: string } }
  | { type: 'UPDATE_HEALTH'; payload: { playerId: string; health: number } }
  | { type: 'UPDATE_SCORE'; payload: { playerId: string; score: number } }
  | { type: 'ADD_FAULT'; payload: { playerId: string; fault: Fault } }
  | { type: 'REMOVE_FAULT'; payload: { playerId: string; faultId: string } }
  | { type: 'SET_TIMER'; payload: number }
  | { type: 'TICK_TIMER' }
  | { type: 'NEXT_ROUND' }
  | { type: 'START_TOURNAMENT'; payload: Tournament }
  | { type: 'START_HIGHLANDER'; payload: HighlanderState }
  | { type: 'START_BATTLE_ROYALE'; payload: BattleRoyaleState }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GameSettings> };