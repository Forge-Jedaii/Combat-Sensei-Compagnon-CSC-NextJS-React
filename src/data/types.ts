// data/types.ts

export type Player = {
  id: string;
  name: string;
  health: number;
  wins: number;
  losses: number;
};

export type Match = {
  id: string;
  player1: Player;
  player2: Player;
  winner?: string;
  timestamp: number;
  duration: number;
  faults: Fault[];
};

export type Fault = {
  playerId: string;
  type: "late" | "illegalMove" | "outOfBounds";
  timestamp: number;
};

export type Handicap = {
  id: string;
  description: string;
  effect: (player: Player) => Player;
};

export type GamePreset = {
  id: string;
  name: string;
  timer: number;
  maxRounds: number;
  handicaps?: string[];
};
