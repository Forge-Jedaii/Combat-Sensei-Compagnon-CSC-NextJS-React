import { Player, GameState, Fault, GameSettings, GameMode } from './types';

export const createPlayer = (name: string, maxHealth: number = 10): Player => ({
  id: Math.random().toString(36).substr(2, 9),
  name,
  health: maxHealth,
  maxHealth,
  score: 0,
  faults: [],
  stats: {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    averageDamagePerMatch: 0,
    longestWinStreak: 0,
    currentWinStreak: 0,
    longestLossStreak: 0,
    perfectGames: 0,
    comebackWins: 0
  },
  ranking: {
    rank: 'Padawan',
    level: 1,
    points: 0,
    badges: [],
    titles: []
  },
  achievements: [],
  tournamentStats: {
    participated: 0,
    won: 0,
    finals: 0,
    semifinals: 0,
    quarterFinals: 0,
    bestRanking: 999
  },
  createdAt: new Date().toISOString(),
  lastActive: new Date().toISOString()
});

export const createInitialGameState = (): GameState => ({
  isActive: false,
  isPaused: false,
  timeRemaining: 120,
  totalTime: 120,
  currentRound: 1,
  maxRounds: 1,
  player1: createPlayer('Joueur 1'),
  player2: createPlayer('Joueur 2'),
  mode: 'duel',
  settings: {
    enableFaults: true,
    enableRounds: false,
    roundDuration: 120,
    breakDuration: 30,
    maxHealth: 10,
    winCondition: 'health',
    scoreToWin: 5,
    enableHandicap: false
  },
  history: []
});

export const calculateDamage = (baseDamage: number, settings: GameSettings, isHandicapped: boolean = false): number => {
  let damage = baseDamage;
  
  if (settings.enableHandicap && settings.handicapSettings && isHandicapped) {
    damage = Math.round(damage * settings.handicapSettings.damageModifier);
  }
  
  return Math.max(1, damage);
};

export const checkWinCondition = (player1: Player, player2: Player, settings: GameSettings): string | null => {
  switch (settings.winCondition) {
    case 'health':
      if (player1.health <= 0) return player2.name;
      if (player2.health <= 0) return player1.name;
      break;
    
    case 'score':
      if (player1.score >= settings.scoreToWin) return player1.name;
      if (player2.score >= settings.scoreToWin) return player2.name;
      break;
    
    case 'time':
      // Géré par le timer
      break;
  }
  
  return null;
};

export const checkTimeWinner = (player1: Player, player2: Player): string | null => {
  if (player1.score > player2.score) return player1.name;
  if (player2.score > player1.score) return player2.name;
  if (player1.health > player2.health) return player1.name;
  if (player2.health > player1.health) return player2.name;
  return null; // Égalité
};

export const applyFault = (player: Player, fault: Fault): Player => {
  const newFaults = [...player.faults, fault];
  let healthPenalty = 0;
  
  // Calculer la pénalité de santé basée sur les fautes
  const yellowCards = newFaults.filter(f => f.type === 'yellow').length;
  const redCards = newFaults.filter(f => f.type === 'red').length;
  
  if (fault.type === 'yellow') {
    healthPenalty = 1;
  } else if (fault.type === 'red') {
    healthPenalty = 3;
  }
  
  // Carton rouge automatique après 3 cartons jaunes
  if (yellowCards >= 3) {
    const autoRedCard: Fault = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'red',
      reason: 'Accumulation de cartons jaunes',
      timestamp: Date.now()
    };
    newFaults.push(autoRedCard);
    healthPenalty += 3;
  }
  
  return {
    ...player,
    faults: newFaults,
    health: Math.max(0, player.health - healthPenalty)
  };
};

export const removeFault = (player: Player, faultId: string): Player => {
  const faultToRemove = player.faults.find(f => f.id === faultId);
  if (!faultToRemove) return player;
  
  const newFaults = player.faults.filter(f => f.id !== faultId);
  let healthRestore = 0;
  
  if (faultToRemove.type === 'yellow') {
    healthRestore = 1;
  } else if (faultToRemove.type === 'red') {
    healthRestore = 3;
  }
  
  return {
    ...player,
    faults: newFaults,
    health: Math.min(player.maxHealth, player.health + healthRestore)
  };
};

export const updatePlayerStats = (player: Player, won: boolean, drew: boolean, damageDealt: number, damageTaken: number): Player => {
  const newStats = { ...player.stats };
  
  newStats.totalMatches++;
  newStats.totalDamageDealt += damageDealt;
  newStats.totalDamageTaken += damageTaken;
  newStats.averageDamagePerMatch = newStats.totalDamageDealt / newStats.totalMatches;
  
  if (won) {
    newStats.wins++;
    newStats.currentWinStreak++;
    newStats.longestWinStreak = Math.max(newStats.longestWinStreak, newStats.currentWinStreak);
    
    if (damageTaken === 0) {
      newStats.perfectGames++;
    }
  } else if (drew) {
    newStats.draws++;
    newStats.currentWinStreak = 0;
  } else {
    newStats.losses++;
    newStats.currentWinStreak = 0;
    
    const lossStreak = 1; // Simplification, devrait être calculé
    newStats.longestLossStreak = Math.max(newStats.longestLossStreak, lossStreak);
  }
  
  newStats.winRate = (newStats.wins / newStats.totalMatches) * 100;
  
  return {
    ...player,
    stats: newStats,
    lastActive: new Date().toISOString()
  };
};

export const calculateRanking = (player: Player): Player => {
  const { stats } = player;
  let points = 0;
  let level = 1;
  let rank = 'Padawan';
  const badges: string[] = [];
  const titles: string[] = [];
  
  // Calcul des points
  points += stats.wins * 10;
  points += stats.draws * 3;
  points -= stats.losses * 2;
  points += stats.perfectGames * 50;
  points += stats.longestWinStreak * 5;
  
  // Calcul du niveau
  level = Math.floor(points / 100) + 1;
  level = Math.min(level, 30); // Niveau maximum
  
  // Détermination du rang
  if (level >= 25) rank = 'Grand Maître Je\'daii';
  else if (level >= 20) rank = 'Maître Je\'daii';
  else if (level >= 15) rank = 'Chevalier Je\'daii';
  else if (level >= 10) rank = 'Gardien Je\'daii';
  else if (level >= 5) rank = 'Apprenti Je\'daii';
  else rank = 'Padawan';
  
  // Attribution des badges
  if (stats.wins >= 100) badges.push('champion');
  if (stats.totalMatches >= 500) badges.push('veteran');
  if (stats.perfectGames >= 10) badges.push('perfectionist');
  if (stats.longestWinStreak >= 10) badges.push('unstoppable');
  if (stats.winRate >= 80 && stats.totalMatches >= 50) badges.push('dominator');
  
  // Attribution des titres
  if (stats.wins >= 1000) titles.push('Légende de la Forge');
  if (stats.perfectGames >= 50) titles.push('Maître Incontesté');
  if (stats.longestWinStreak >= 25) titles.push('Force Inarrêtable');
  
  return {
    ...player,
    ranking: {
      rank,
      level,
      points: Math.max(0, points),
      badges,
      titles
    }
  };
};

export const generateTournamentBracket = (players: string[], type: 'elimination' | 'round_robin') => {
  // Logique de génération de bracket déjà implémentée dans TournamentBracket.tsx
  // Cette fonction peut être extraite et réutilisée
  return [];
};

export const getRandomFaultReason = (type: 'yellow' | 'red'): string => {
  const yellowReasons = [
    'Sortie de zone',
    'Contact non contrôlé',
    'Attitude non sportive',
    'Retard à l\'engagement',
    'Simulation',
    'Refus de combattre'
  ];
  
  const redReasons = [
    'Contact dangereux',
    'Brutalité excessive',
    'Comportement antisportif grave',
    'Refus d\'obéir à l\'arbitre',
    'Violence verbale',
    'Geste technique dangereux'
  ];
  
  const reasons = type === 'yellow' ? yellowReasons : redReasons;
  return reasons[Math.floor(Math.random() * reasons.length)];
};