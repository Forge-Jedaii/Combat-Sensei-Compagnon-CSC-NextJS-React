export const GAME_MODES = {
  duel: {
    name: 'Duel Libre',
    description: 'Combat libre entre deux Je\'daii',
    icon: '⚔️',
    maxPlayers: 2,
    defaultSettings: {
      enableFaults: true,
      enableRounds: false,
      roundDuration: 120,
      maxHealth: 10,
      winCondition: 'health' as const
    }
  },
  official: {
    name: 'Duel Officiel',
    description: 'Combat selon les règles officielles',
    icon: '🏛️',
    maxPlayers: 2,
    defaultSettings: {
      enableFaults: true,
      enableRounds: true,
      roundDuration: 90,
      breakDuration: 30,
      maxHealth: 10,
      winCondition: 'score' as const,
      scoreToWin: 5
    }
  },
  handicap: {
    name: 'Duel Handicap',
    description: 'Combat avec avantages/désavantages',
    icon: '⚖️',
    maxPlayers: 2,
    defaultSettings: {
      enableFaults: true,
      enableHandicap: true,
      maxHealth: 10,
      winCondition: 'health' as const
    }
  },
  tournament: {
    name: 'Tournoi',
    description: 'Compétition entre plusieurs Je\'daii',
    icon: '🏆',
    maxPlayers: 16,
    defaultSettings: {
      enableFaults: true,
      roundDuration: 120,
      maxHealth: 10,
      winCondition: 'health' as const
    }
  },
  highlander: {
    name: 'Highlander',
    description: 'Il ne peut en rester qu\'un !',
    icon: '🔥',
    maxPlayers: 8,
    defaultSettings: {
      enableFaults: true,
      roundDuration: 120,
      maxHealth: 10,
      winCondition: 'health' as const
    }
  },
  battle_royale: {
    name: 'Battle Royale',
    description: 'Survie dans une zone qui rétrécit',
    icon: '💥',
    maxPlayers: 8,
    defaultSettings: {
      enableFaults: false,
      roundDuration: 300,
      maxHealth: 15,
      winCondition: 'health' as const
    }
  }
};

export const RANKS = [
  { name: 'Padawan', minLevel: 1, color: '#8B4513' },
  { name: 'Apprenti Je\'daii', minLevel: 5, color: '#4169E1' },
  { name: 'Gardien Je\'daii', minLevel: 10, color: '#32CD32' },
  { name: 'Chevalier Je\'daii', minLevel: 15, color: '#FFD700' },
  { name: 'Maître Je\'daii', minLevel: 20, color: '#FF4500' },
  { name: 'Grand Maître Je\'daii', minLevel: 25, color: '#8A2BE2' }
];

export const BADGES = {
  champion: { name: 'Champion', icon: '🏆', description: '100 victoires' },
  veteran: { name: 'Vétéran', icon: '🎖️', description: '500 combats' },
  perfectionist: { name: 'Perfectionniste', icon: '💎', description: '10 matchs parfaits' },
  rising_star: { name: 'Étoile Montante', icon: '⭐', description: 'Progression rapide' },
  determined: { name: 'Déterminé', icon: '💪', description: 'Persévérance' },
  dominator: { name: 'Dominateur', icon: '👑', description: '80% de victoires' },
  fearless: { name: 'Intrépide', icon: '🦁', description: 'Courage au combat' },
  comeback_king: { name: 'Roi du Comeback', icon: '🔄', description: 'Retournements de situation' },
  unstoppable: { name: 'Inarrêtable', icon: '🚀', description: 'Série de 10 victoires' }
};

export const ACHIEVEMENTS = {
  first_win: { name: 'Première Victoire', icon: '🥇', description: 'Remporter son premier combat' },
  perfect_game: { name: 'Match Parfait', icon: '💯', description: 'Gagner sans subir de dégâts' },
  tournament_winner: { name: 'Vainqueur de Tournoi', icon: '🏆', description: 'Remporter un tournoi' },
  comeback_king: { name: 'Roi du Comeback', icon: '🔄', description: 'Gagner avec 1 PV restant' },
  unstoppable: { name: 'Série Inarrêtable', icon: '🚀', description: '10 victoires consécutives' }
};

export const FAULT_REASONS = {
  yellow: [
    'Sortie de zone',
    'Contact non contrôlé',
    'Attitude non sportive',
    'Retard à l\'engagement',
    'Simulation',
    'Refus de combattre',
    'Geste technique incorrect',
    'Manque de maîtrise'
  ],
  red: [
    'Contact dangereux',
    'Brutalité excessive',
    'Comportement antisportif grave',
    'Refus d\'obéir à l\'arbitre',
    'Violence verbale',
    'Geste technique dangereux',
    'Mise en danger d\'autrui',
    'Récidive grave'
  ]
};

export const SOUND_EFFECTS = {
  hit: { frequency: 800, duration: 100 },
  fault: { frequency: 400, duration: 200 },
  victory: { frequency: 1000, duration: 500 },
  defeat: { frequency: 200, duration: 800 },
  timer: { frequency: 600, duration: 50 },
  round_end: { frequency: 1200, duration: 300 }
};

export const VIBRATION_PATTERNS = {
  hit: [50],
  fault: [100, 50, 100],
  victory: [200, 100, 200, 100, 200],
  defeat: [500],
  timer: [25],
  round_end: [150, 50, 150]
};

export const DEFAULT_SETTINGS = {
  soundEnabled: true,
  vibrationEnabled: true,
  theme: 'cyber' as const,
  language: 'fr' as const,
  autoSave: true,
  showTutorial: true
};

export const TUTORIAL_STEPS = [
  {
    target: '.mode-selection',
    title: 'Choix du Mode',
    content: 'Sélectionnez le type de combat que vous souhaitez organiser.'
  },
  {
    target: '.player-setup',
    title: 'Configuration des Joueurs',
    content: 'Entrez les noms des combattants et ajustez les paramètres.'
  },
  {
    target: '.combat-area',
    title: 'Zone de Combat',
    content: 'Utilisez les boutons pour infliger des dégâts et gérer les fautes.'
  },
  {
    target: '.timer',
    title: 'Chronomètre',
    content: 'Surveillez le temps restant et contrôlez le déroulement du match.'
  }
];

// src/data/gameData.ts

export const handicaps = [
  "Combattre avec une seule main",
  "Commencer avec 1 point en moins",
  "Doit rester en mouvement constant",
  "Ne peut attaquer qu’en rotation",
  "Doit tenir son sabre à deux mains",
  "Temps de réaction réduit (malus)",
  "Interdiction de reculer",
  "Sabre à l’envers",
  "Défense uniquement en parade circulaire",
  "Doit annoncer ses attaques avant de frapper",
  "N’a le droit qu’à une zone valide par échange",
  "Sabre tenu uniquement de la main non dominante",
  "Obligation de saut dans chaque échange",
  "Un bras derrière le dos",
  "Doit toucher deux fois pour marquer un point",
  "Doit fermer les yeux 2 secondes avant chaque attaque",
  "Doit reculer après chaque touche portée",
  "Ne peut pas attaquer deux fois de suite",
  "Commence le duel accroupi",
];
