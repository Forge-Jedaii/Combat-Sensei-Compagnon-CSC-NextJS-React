"use client";

import React, { useState, useEffect } from "react";

// Définition des rangs
export const RANKS = [
  { name: 'Lame Vagabonde', minLevel: 1, color: '#8B4513' },
  { name: 'Gladiateur Initié', minLevel: 5, color: '#4169E1' },
  { name: 'Vétéran de l\'arène', minLevel: 10, color: '#32CD32' },
  { name: 'Champion Jedaii', minLevel: 15, color: '#FFD700' },
  { name: 'Élu du Panthéon', minLevel: 20, color: '#FF4500' },
  { name: 'Légende Vivante', minLevel: 25, color: '#8A2BE2' }
];

// Interface pour les stats d'un joueur (alignée avec IRanking)
interface PlayerStats {
  userId: string;
  score: number;
  victories: number;
  defeats: number;
  totalCombats: number;
  winRate: number;
  level: number;
  rank: typeof RANKS[0];
  lastActivity?: string;
}

interface RankingTableProps {
  onClose?: () => void;
  embedded?: boolean;
}

export default function RankingTable({ onClose, embedded = false }: RankingTableProps) {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'winRate' | 'victories' | 'totalCombats'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterRank, setFilterRank] = useState<string>('all');

  // Fonction pour déterminer le rang d'un joueur basé sur le ratio victoires/défaites
  const getRankForPlayer = (victories: number, defeats: number): typeof RANKS[0] => {
    const totalCombats = victories + defeats;
    
    // Minimum de combats requis pour avoir un rang
    if (totalCombats < 5) return RANKS[0]; // Lame Vagabonde par défaut
    
    const winRate = (victories / totalCombats) * 100;
    
    // Système de rangs basé sur le taux de victoire + minimum de combats
    if (winRate >= 85 && totalCombats >= 50) return RANKS[5]; // Légende Vivante (85%+ avec 50+ combats)
    if (winRate >= 75 && totalCombats >= 35) return RANKS[4]; // Élu du Panthéon (75%+ avec 35+ combats)
    if (winRate >= 65 && totalCombats >= 25) return RANKS[3]; // Champion Jedaii (65%+ avec 25+ combats)
    if (winRate >= 55 && totalCombats >= 15) return RANKS[2]; // Vétéran de l'arène (55%+ avec 15+ combats)
    if (winRate >= 45 && totalCombats >= 5) return RANKS[1];  // Gladiateur Initié (45%+ avec 5+ combats)
    
    return RANKS[0]; // Lame Vagabonde
  };

  // Charger les données des classements
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        
        // Remplacer par votre vraie API
        // const response = await fetch('/api/rankings');
        // const rankingsData = await response.json();
        
        // Données d'exemple pour la démo (structure alignée avec IRanking)
        const mockRankings = [
          { userId: "maître-yoda", score: 1450, victories: 45, defeats: 5 },
          { userId: "obi-wan", score: 1380, victories: 38, defeats: 12 },
          { userId: "anakin", score: 1350, victories: 35, defeats: 15 },
          { userId: "ahsoka", score: 1280, victories: 28, defeats: 8 },
          { userId: "mace-windu", score: 1400, victories: 40, defeats: 10 },
          { userId: "luke-skywalker", score: 1250, victories: 25, defeats: 18 },
          { userId: "rey", score: 1220, victories: 22, defeats: 13 },
          { userId: "kylo-ren", score: 1000, victories: 20, defeats: 20 },
          { userId: "qui-gon", score: 1300, victories: 30, defeats: 12 },
          { userId: "padawan-alex", score: 930, victories: 8, defeats: 15 },
        ];

        const processedPlayers: PlayerStats[] = mockRankings.map(ranking => {
          const totalCombats = ranking.victories + ranking.defeats;
          const winRate = totalCombats > 0 ? (ranking.victories / totalCombats) * 100 : 0;
          const level = Math.floor(ranking.score / 100) + Math.floor(ranking.victories / 5);
          const rank = getRankForPlayer(ranking.victories, ranking.defeats);

          return {
            userId: ranking.userId,
            score: ranking.score,
            victories: ranking.victories,
            defeats: ranking.defeats,
            totalCombats,
            winRate,
            level,
            rank,
            lastActivity: `Il y a ${Math.floor(Math.random() * 30) + 1} jours`
          };
        });

        setPlayers(processedPlayers);
      } catch (error) {
        console.error('Erreur lors du chargement des classements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  // Tri des joueurs
  const sortedPlayers = [...players].sort((a, b) => {
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    return (a[sortBy] - b[sortBy]) * multiplier;
  });

  // Filtrage par rang
  const filteredPlayers = sortedPlayers.filter(player => 
    filterRank === 'all' || player.rank.name === filterRank
  );

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getRankIcon = (rankName: string) => {
    const icons: Record<string, string> = {
      'Lame Vagabonde': '⚔️',
      'Gladiateur Initié': '🛡️',
      'Vétéran de l\'arène': '🏆',
      'Champion Jedaii': '👑',
      'Élu du Panthéon': '✨',
      'Légende Vivante': '🌟'
    };
    return icons[rankName] || '⚔️';
  };

  // Formatter le nom d'utilisateur pour l'affichage
  const formatUserName = (userId: string) => {
    return userId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-cyber-blue text-xl font-orbitron">
          ⚔️ Chargement des classements...
        </div>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-cyber-blue text-glow font-orbitron">
          🏆 Classement des Guerriers
        </h1>
        <p className="text-gray-300 font-orbitron">
          Archives de la Forge Je&apos;daii
        </p>
      </div>

      {/* Filtres et contrôles */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Filtre par rang */}
        <div className="flex items-center gap-2">
          <label className="text-cyber-blue font-bold">Filtrer par rang:</label>
          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="bg-black/60 border-2 border-cyber-blue/40 rounded-lg px-3 py-1 text-white font-orbitron"
          >
            <option value="all">Tous les rangs</option>
            {RANKS.map(rank => (
              <option key={rank.name} value={rank.name}>
                {rank.name}
              </option>
            ))}
          </select>
        </div>

        {/* Statistiques générales */}
        <div className="text-sm text-gray-400 font-orbitron">
          <span className="text-cyber-blue font-bold">{filteredPlayers.length}</span> guerriers actifs
        </div>
      </div>

      {/* Légende des rangs */}
      <div className="bg-black/40 rounded-xl p-4 border border-cyber-blue/30">
        <h3 className="text-lg font-bold text-cyber-blue mb-3 font-orbitron">
          📊 Système de Rangs
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {RANKS.map(rank => (
            <div
              key={rank.name}
              className="flex items-center gap-1 p-2 bg-black/60 rounded-lg border"
              style={{ borderColor: rank.color + '40' }}
            >
              <span>{getRankIcon(rank.name)}</span>
              <div className="text-xs">
                <div style={{ color: rank.color }} className="font-bold">
                  {rank.name}
                </div>
                <div className="text-gray-400">Niv. {rank.minLevel}+</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau principal */}
      <div className="bg-black/40 rounded-xl border border-cyber-blue/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cyber-blue/20">
              <tr>
                <th className="p-3 text-left text-cyber-blue font-bold font-orbitron">Position</th>
                <th className="p-3 text-left text-cyber-blue font-bold font-orbitron">Guerrier</th>
                <th 
                  className="p-3 text-center text-cyber-blue font-bold font-orbitron cursor-pointer hover:text-cyan-300"
                  onClick={() => handleSort('score')}
                >
                  Score {sortBy === 'score' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="p-3 text-center text-cyber-blue font-bold font-orbitron">Rang</th>
                <th 
                  className="p-3 text-center text-cyber-blue font-bold font-orbitron cursor-pointer hover:text-cyan-300"
                  onClick={() => handleSort('victories')}
                >
                  Victoires {sortBy === 'victories' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="p-3 text-center text-cyber-blue font-bold font-orbitron cursor-pointer hover:text-cyan-300"
                  onClick={() => handleSort('winRate')}
                >
                  Taux de réussite {sortBy === 'winRate' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className="p-3 text-center text-cyber-blue font-bold font-orbitron cursor-pointer hover:text-cyan-300"
                  onClick={() => handleSort('totalCombats')}
                >
                  Combats {sortBy === 'totalCombats' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="p-3 text-center text-cyber-blue font-bold font-orbitron">Activité</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr
                  key={player.userId}
                  className={`border-t border-cyber-blue/20 hover:bg-cyber-blue/10 transition-colors ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      <span className="text-white font-bold">#{index + 1}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyber-blue to-cyber-purple rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {formatUserName(player.userId).charAt(0)}
                      </div>
                      <span className="text-white font-bold font-orbitron">
                        {formatUserName(player.userId)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-cyber-blue font-bold text-lg">{player.score}</span>
                      <span className="text-xs text-gray-400">(Niv. {player.level})</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>{getRankIcon(player.rank.name)}</span>
                      <span
                        className="font-bold text-sm"
                        style={{ color: player.rank.color }}
                      >
                        {player.rank.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-green-400 font-bold">{player.victories}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-red-400">{player.defeats}</span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={`font-bold ${
                          player.winRate >= 70 ? 'text-green-400' :
                          player.winRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}
                      >
                        {player.winRate.toFixed(1)}%
                      </span>
                      <div className="w-16 h-2 bg-black/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            player.winRate >= 70 ? 'bg-green-400' :
                            player.winRate >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${player.winRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-white font-bold">{player.totalCombats}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-gray-400 text-sm">{player.lastActivity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚔️</div>
          <p className="text-gray-400 text-lg font-orbitron">
            Aucun guerrier trouvé pour ce rang
          </p>
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