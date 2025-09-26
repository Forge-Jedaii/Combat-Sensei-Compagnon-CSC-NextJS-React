
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



