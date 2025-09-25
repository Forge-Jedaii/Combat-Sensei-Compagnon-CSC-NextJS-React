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


export const BADGES = {
  champion: { name: 'Champion', icon: '🏆', description: '100 victoires' },
  veteran: { name: 'Vétéran', icon: '🎖️', description: '500 combats' },
  perfectionist: { name: 'Perfectionniste', icon: '💎', description: '10 matchs parfaits' },
  rising_star: { name: 'Étoile Montante', icon: '⭐', description: 'Progression rapide' },
  determined: { name: 'Déterminé', icon: '💪', description: 'Persévérance' },
  dominator: { name: 'Dominateur', icon: '👑', description: '80% de victoires' },
  fearless: { name: 'Intrépide', icon: '🦁', description: 'Courage au combat' },
  comeback_king: { name: 'Roi du Comeback', icon: '🔄', description: 'Retournements de situation' },
  unstoppable: { name: 'Inarrêtable', icon: '🚀', description: 'Série de 10 victoires' },

  // Mode duel classique 1vs1
  duel_master: { name: 'Maître du Duel', icon: '⚔️', description: 'Victoire en duel 1vs1 classique' },
  duel_champion: { name: 'Champion du Duel', icon: '🏹', description: '10 victoires en duel 1vs1 classique' },

  // Mode duel officiel 1vs1
  official_warrior: { name: 'Guerrier Officiel', icon: '🛡️', description: 'Victoire en duel 1vs1 officiel' },
  official_champion: { name: 'Champion Officiel', icon: '🎖️', description: '5 victoires en duel 1vs1 officiel' },

  // Mode Highlander
  highlander_survivor: { name: 'Survivant Highlander', icon: '🏔️', description: 'Victoire en mode Highlander' },
  highlander_legend: { name: 'Légende Highlander', icon: '⚡', description: '10 victoires en mode Highlander' },

  // Mode tournoi
  tournament_fighter: { name: 'Combattant du Tournoi', icon: '🏟️', description: 'Participé à un tournoi' },
  tournament_champion: { name: 'Champion du Tournoi', icon: '🥇', description: 'Vainqueur d’un tournoi' },

  // Mode handicap
  underdog: { name: 'Challenger', icon: '🦾', description: 'Victoire en mode handicap' },
  against_all_odds: { name: 'Contre Toute Attente', icon: '🔥', description: '10 victoires en mode handicap' },

  // Autres badges généraux
  relentless: { name: 'Implacable', icon: '🔥', description: '10 combats sans perdre' },
  strategist: { name: 'Stratège', icon: '🧠', description: 'Victoire grâce à une tactique parfaite' },
  hero_of_the_crowd: { name: 'Héros du Public', icon: '🎉', description: 'Acclamé par les spectateurs' },
  shadow_fighter: { name: 'Guerrier de l’Ombre', icon: '🌑', description: 'Victoire discrète et surprenante' },
  titan_slayer: { name: 'Tueur de Titan', icon: '⚡', description: 'Vaincu un adversaire supérieur' },
  iron_will: { name: 'Volonté de Fer', icon: '🛡️', description: 'Ne jamais abandonner' },
  lightning_strike: { name: 'Frappe Éclair', icon: '🌩️', description: 'Victoire rapide' },
  legend_in_the_making: { name: 'Légende en Devenir', icon: '🏹', description: 'Atteint un rang mythique' }
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

