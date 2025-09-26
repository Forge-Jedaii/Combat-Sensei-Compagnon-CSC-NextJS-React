"use client";

import React, { useState, useEffect } from "react";

// Définition des badges
export const BADGES = {
  champion: { name: 'Champion', icon: '🏆', description: '100 victoires', rarity: 'legendary' },
  veteran: { name: 'Vétéran', icon: '🎖️', description: '500 combats', rarity: 'legendary' },
  perfectionist: { name: 'Perfectionniste', icon: '💎', description: '10 matchs parfaits', rarity: 'epic' },
  rising_star: { name: 'Étoile Montante', icon: '⭐', description: 'Progression rapide', rarity: 'rare' },
  determined: { name: 'Déterminé', icon: '💪', description: 'Persévérance', rarity: 'common' },
  dominator: { name: 'Dominateur', icon: '👑', description: '80% de victoires', rarity: 'epic' },
  fearless: { name: 'Intrépide', icon: '🦁', description: 'Courage au combat', rarity: 'rare' },
  comeback_king: { name: 'Roi du Comeback', icon: '🔄', description: 'Retournements de situation', rarity: 'epic' },
  unstoppable: { name: 'Inarrêtable', icon: '🚀', description: 'Série de 10 victoires', rarity: 'rare' },

  // Mode duel classique 1vs1
  duel_master: { name: 'Maître du Duel', icon: '⚔️', description: 'Victoire en duel 1vs1 classique', rarity: 'common' },
  duel_champion: { name: 'Champion du Duel', icon: '🏹', description: '10 victoires en duel 1vs1 classique', rarity: 'rare' },

  // Mode duel officiel 1vs1
  official_warrior: { name: 'Guerrier Officiel', icon: '🛡️', description: 'Victoire en duel 1vs1 officiel', rarity: 'rare' },
  official_champion: { name: 'Champion Officiel', icon: '🎖️', description: '5 victoires en duel 1vs1 officiel', rarity: 'epic' },

  // Mode Highlander
  highlander_survivor: { name: 'Survivant Highlander', icon: '🏔️', description: 'Victoire en mode Highlander', rarity: 'rare' },
  highlander_legend: { name: 'Légende Highlander', icon: '⚡', description: '10 victoires en mode Highlander', rarity: 'legendary' },

  // Mode tournoi
  tournament_fighter: { name: 'Combattant du Tournoi', icon: '🏟️', description: 'Participé à un tournoi', rarity: 'common' },
  tournament_champion: { name: 'Champion du Tournoi', icon: '🥇', description: 'Vainqueur d un tournoi', rarity: 'legendary' },

  // Mode handicap
  underdog: { name: 'Challenger', icon: '🦾', description: 'Victoire en mode handicap', rarity: 'common' },
  against_all_odds: { name: 'Contre Toute Attente', icon: '🔥', description: '10 victoires en mode handicap', rarity: 'epic' },

  // Autres badges généraux
  relentless: { name: 'Implacable', icon: '🔥', description: '10 combats sans perdre', rarity: 'rare' },
  strategist: { name: 'Stratège', icon: '🧠', description: 'Victoire grâce à une tactique parfaite', rarity: 'rare' },
  hero_of_the_crowd: { name: 'Héros du Public', icon: '🎉', description: 'Acclamé par les spectateurs', rarity: 'epic' },
  shadow_fighter: { name: 'Guerrier de l\'Ombre', icon: '🌑', description: 'Victoire discrète et surprenante', rarity: 'rare' },
  titan_slayer: { name: 'Tueur de Titan', icon: '⚡', description: 'Vaincu un adversaire supérieur', rarity: 'epic' },
  iron_will: { name: 'Volonté de Fer', icon: '🛡️', description: 'Ne jamais abandonner', rarity: 'rare' },
  lightning_strike: { name: 'Frappe Éclair', icon: '🌩️', description: 'Victoire rapide', rarity: 'common' },
  legend_in_the_making: { name: 'Légende en Devenir', icon: '🏹', description: 'Atteint un rang mythique', rarity: 'legendary' }
} as const;

// Types
type BadgeKey = keyof typeof BADGES;
type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface UserBadge {
  badgeKey: BadgeKey;
  unlockedAt: string;
  progress?: number; // Pour les badges progressifs
}

interface BadgeProps {
  onClose?: () => void;
  embedded?: boolean;
  userId?: string; // Pour charger les badges d'un utilisateur spécifique
}

export default function Badge({ onClose, embedded = false, userId }: BadgeProps) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRarity, setFilterRarity] = useState<BadgeRarity | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeKey | null>(null);

  // Couleurs par rareté
  const getRarityColors = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'common':
        return {
          border: 'border-gray-400',
          bg: 'bg-gray-500/10',
          glow: 'shadow-gray-400/20',
          text: 'text-gray-300'
        };
      case 'rare':
        return {
          border: 'border-blue-400',
          bg: 'bg-blue-500/10',
          glow: 'shadow-blue-400/30',
          text: 'text-blue-300'
        };
      case 'epic':
        return {
          border: 'border-purple-400',
          bg: 'bg-purple-500/10',
          glow: 'shadow-purple-400/40',
          text: 'text-purple-300'
        };
      case 'legendary':
        return {
          border: 'border-yellow-400',
          bg: 'bg-yellow-500/10',
          glow: 'shadow-yellow-400/50',
          text: 'text-yellow-300'
        };
    }
  };

  // Charger les badges de l'utilisateur
  useEffect(() => {
    const fetchUserBadges = async () => {
      try {
        setLoading(true);
        
        // Remplacer par votre vraie API
        // const response = await fetch(`/api/badges/${userId || 'current'}`);
        // const badgesData = await response.json();
        
        // Données d'exemple - badges débloqués
        const mockUserBadges: UserBadge[] = [
          { badgeKey: 'duel_master', unlockedAt: '2025-01-15T10:30:00Z' },
          { badgeKey: 'rising_star', unlockedAt: '2025-01-16T14:22:00Z' },
          { badgeKey: 'determined', unlockedAt: '2025-01-10T09:15:00Z' },
          { badgeKey: 'fearless', unlockedAt: '2025-01-18T16:45:00Z' },
          { badgeKey: 'lightning_strike', unlockedAt: '2025-01-12T11:30:00Z' },
          { badgeKey: 'official_warrior', unlockedAt: '2025-01-20T13:20:00Z' },
          { badgeKey: 'unstoppable', unlockedAt: '2025-01-22T15:10:00Z', progress: 7 }, // 7/10 victoires consécutives
          { badgeKey: 'champion', unlockedAt: '2025-01-25T18:00:00Z' },
        ];

        setUserBadges(mockUserBadges);
      } catch (error) {
        console.error('Erreur lors du chargement des badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBadges();
  }, [userId]);

  // Vérifier si un badge est débloqué
  const isBadgeUnlocked = (badgeKey: BadgeKey): boolean => {
    return userBadges.some(ub => ub.badgeKey === badgeKey);
  };

  // Obtenir les informations d'un badge utilisateur
  const getUserBadgeInfo = (badgeKey: BadgeKey): UserBadge | undefined => {
    return userBadges.find(ub => ub.badgeKey === badgeKey);
  };

  // Filtrer les badges
  const filteredBadges = Object.entries(BADGES).filter(([key, badge]) => {
    const badgeKey = key as BadgeKey;
    
    // Filtre par rareté
    if (filterRarity !== 'all' && badge.rarity !== filterRarity) {
      return false;
    }
    
    // Filtre débloqué uniquement
    if (showUnlockedOnly && !isBadgeUnlocked(badgeKey)) {
      return false;
    }
    
    return true;
  });

  // Statistiques
  const totalBadges = Object.keys(BADGES).length;
  const unlockedBadges = userBadges.length;
  const completionRate = (unlockedBadges / totalBadges) * 100;

  // Grouper par catégorie
  const groupedBadges = {
    general: ['champion', 'veteran', 'perfectionist', 'rising_star', 'determined', 'dominator', 'fearless', 'comeback_king', 'unstoppable'],
    modes: ['duel_master', 'duel_champion', 'official_warrior', 'official_champion', 'highlander_survivor', 'highlander_legend', 'tournament_fighter', 'tournament_champion', 'underdog', 'against_all_odds'],
    special: ['relentless', 'strategist', 'hero_of_the_crowd', 'shadow_fighter', 'titan_slayer', 'iron_will', 'lightning_strike', 'legend_in_the_making']
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-cyber-blue text-xl font-orbitron">
          🏆 Chargement des badges...
        </div>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-cyber-blue text-glow font-orbitron">
          🏆 Collection de Badges
        </h1>
        <p className="text-gray-300 font-orbitron">
          Trophées et Accomplissements
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-black/40 rounded-xl p-4 border border-cyber-blue/30 text-center">
          <div className="text-2xl font-bold text-cyber-blue">{unlockedBadges}</div>
          <div className="text-sm text-gray-400">Badges débloqués</div>
        </div>
        <div className="bg-black/40 rounded-xl p-4 border border-cyber-blue/30 text-center">
          <div className="text-2xl font-bold text-purple-400">{totalBadges}</div>
          <div className="text-sm text-gray-400">Total disponible</div>
        </div>
        <div className="bg-black/40 rounded-xl p-4 border border-cyber-blue/30 text-center">
          <div className="text-2xl font-bold text-green-400">{completionRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Progression</div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="bg-black/40 rounded-xl p-4 border border-cyber-blue/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-cyber-blue font-bold">Progression générale</span>
          <span className="text-sm text-gray-400">{unlockedBadges}/{totalBadges}</span>
        </div>
        <div className="w-full bg-black/60 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-cyber-blue to-purple-400 h-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-cyber-blue font-bold">Rareté:</label>
            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value as BadgeRarity | 'all')}
              className="bg-black/60 border-2 border-cyber-blue/40 rounded-lg px-3 py-1 text-white font-orbitron"
            >
              <option value="all">Toutes</option>
              <option value="common">Commune</option>
              <option value="rare">Rare</option>
              <option value="epic">Épique</option>
              <option value="legendary">Légendaire</option>
            </select>
          </div>
          
          <label className="flex items-center gap-2 text-cyber-blue">
            <input
              type="checkbox"
              checked={showUnlockedOnly}
              onChange={(e) => setShowUnlockedOnly(e.target.checked)}
              className="rounded"
            />
            Débloqués uniquement
          </label>
        </div>
      </div>

      {/* Collection de badges */}
      <div className="space-y-8">
        {Object.entries(groupedBadges).map(([category, badgeKeys]) => {
          const categoryBadges = badgeKeys.filter(key => 
            filteredBadges.some(([fKey]) => fKey === key)
          );
          
          if (categoryBadges.length === 0) return null;
          
          const categoryTitle = {
            general: '🏆 Badges Généraux',
            modes: '🎮 Badges de Modes',
            special: '✨ Badges Spéciaux'
          }[category];

          return (
            <div key={category} className="space-y-4">
              <h3 className="text-xl font-bold text-cyber-blue text-glow font-orbitron">
                {categoryTitle}
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {categoryBadges.map(badgeKey => {
                  const badge = BADGES[badgeKey as BadgeKey];
                  const userBadge = getUserBadgeInfo(badgeKey as BadgeKey);
                  const isUnlocked = !!userBadge;
                  const colors = getRarityColors(badge.rarity);
                  
                  return (
                    <div
                      key={badgeKey}
                      onClick={() => setSelectedBadge(badgeKey as BadgeKey)}
                      className={`
                        relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                        ${colors.border} ${colors.bg} ${colors.text}
                        ${isUnlocked ? `${colors.glow} hover:scale-105` : 'opacity-50 grayscale'}
                        hover:shadow-xl
                      `}
                    >
                      {/* Badge icon */}
                      <div className="text-center">
                        <div className="text-4xl mb-2">{badge.icon}</div>
                        <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                        
                        {/* Status indicator */}
                        {isUnlocked ? (
                          <div className="text-xs text-green-400 font-bold">✓ Débloqué</div>
                        ) : (
                          <div className="text-xs text-gray-500">Verrouillé</div>
                        )}
                        
                        {/* Progress bar pour badges progressifs */}
                        {userBadge?.progress && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-400 mb-1">
                              Progression: {userBadge.progress}/10
                            </div>
                            <div className="w-full bg-black/60 rounded-full h-1">
                              <div 
                                className="bg-cyber-blue h-1 rounded-full"
                                style={{ width: `${(userBadge.progress / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Rarity indicator */}
                      <div className="absolute top-1 right-1 text-xs font-bold opacity-60">
                        {badge.rarity === 'legendary' && '★★★★'}
                        {badge.rarity === 'epic' && '★★★'}
                        {badge.rarity === 'rare' && '★★'}
                        {badge.rarity === 'common' && '★'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-400 text-lg font-orbitron">
            Aucun badge trouvé avec ces filtres
          </p>
        </div>
      )}

      {/* Modal détails du badge */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-cyber-blue rounded-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">{BADGES[selectedBadge].icon}</div>
              <h3 className="text-2xl font-bold text-cyber-blue mb-2">
                {BADGES[selectedBadge].name}
              </h3>
              
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 ${getRarityColors(BADGES[selectedBadge].rarity).text} ${getRarityColors(BADGES[selectedBadge].rarity).bg} border ${getRarityColors(BADGES[selectedBadge].rarity).border}`}>
                {BADGES[selectedBadge].rarity.charAt(0).toUpperCase() + BADGES[selectedBadge].rarity.slice(1)}
              </div>
              
              <p className="text-gray-300 mb-4">
                {BADGES[selectedBadge].description}
              </p>
              
              {getUserBadgeInfo(selectedBadge) ? (
                <div className="space-y-2">
                  <div className="text-green-400 font-bold">✓ Badge débloqué</div>
                  <div className="text-sm text-gray-400">
                    Obtenu le {new Date(getUserBadgeInfo(selectedBadge)!.unlockedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Badge non débloqué</div>
              )}
              
              <button
                onClick={() => setSelectedBadge(null)}
                className="mt-6 w-full bg-cyber-blue text-white font-bold py-2 rounded-lg hover:bg-cyan-400 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyber-dark via-cyber-purple to-cyber-navy p-6">
      <div className="max-w-7xl mx-auto">
        {/* Bouton retour si pas embedded */}
        {onClose && (
          <div className="mb-6">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-cyber-blue hover:text-cyan-300 transition-colors font-orbitron font-bold"
            >
              ← Retour au menu principal
            </button>
          </div>
        )}
        
        {content}
      </div>
    </div>
  );
}