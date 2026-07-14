"use client";

import React, { useState, useRef } from "react";

export type FaultType = "jaune" | "rouge" | "noir";

export type Fault = {
  player: string;
  type: FaultType;
  reason: string;
  time: string;
};

interface FaultSystemProps {
  player1: string;
  player2: string;
  onFaultPenalty: (target: "left" | "right", penaltyType: "hp" | "disqualification", winner: string | undefined, fault: { type: FaultType; reason: string }) => void;
}

export default function FaultSystem({ player1, player2, onFaultPenalty }: FaultSystemProps) {
  const [fautes, setFautes] = useState<Fault[]>([]);
  const [showFautes, setShowFautes] = useState(false);
  const [showAttribution, setShowAttribution] = useState<{
    target: "left" | "right";
    type: FaultType;
  } | null>(null);
  const [reason, setReason] = useState("zone");
  
  // Compteurs séparés pour jaune et rouge
  const faultCounts = useRef({ 
    left: { jaune: 0, rouge: 0 }, 
    right: { jaune: 0, rouge: 0 } 
  });

  // Confirmer une faute depuis la modal
  const confirmFaute = () => {
    if (!showAttribution) return;
    const { target, type } = showAttribution;
    const playerName = target === "left" ? player1 : player2;
    const time = new Date().toLocaleTimeString();

    const newFault: Fault = { player: playerName, type, reason, time };
    setFautes((prev) => [...prev, newFault]);

    // Règles selon le type de faute
    if (type === "jaune") {
      faultCounts.current[target].jaune += 1;
      // 2 cartons jaunes = perte d'1 HP
      if (faultCounts.current[target].jaune >= 2) {
        onFaultPenalty(target, "hp", undefined, { type, reason });
        faultCounts.current[target].jaune = 0; // Reset après pénalité
      }
    } 
    else if (type === "rouge") {
      faultCounts.current[target].rouge += 1;
      // 1 carton rouge = disqualification immédiate
      const winner = target === "left" ? player2 : player1;
      onFaultPenalty(target, "disqualification", winner, { type, reason });
    }
    else if (type === "noir") {
      // Carton noir = disqualification immédiate
      const winner = target === "left" ? player2 : player1;
      onFaultPenalty(target, "disqualification", winner + " (victoire par disqualification)", { type, reason });
    }

    setShowAttribution(null);
  };

  // Obtenir les fautes d'un joueur par type
  const getPlayerFaults = (playerName: string, faultType?: FaultType) => {
    return fautes.filter(f => f.player === playerName && (faultType ? f.type === faultType : true));
  };

  return (
    <>
      {/* Fautes Cards */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-black/30 border-t border-cyber-blue/30">
        {[{ side: "left", name: player1, color: "text-green-400 border-green-400" },
          { side: "right", name: player2, color: "text-yellow-400 border-yellow-400" }]
          .map(({ side, name, color }) => {
            const yellowFaults = getPlayerFaults(name, "jaune");
            const redFaults = getPlayerFaults(name, "rouge");
            const blackFaults = getPlayerFaults(name, "noir");
            
            return (
              <div key={side} className={`bg-black/60 rounded-lg p-3 border ${color}`}>
                <div className={`${color} font-bold mb-2 text-center`}>{name}</div>
                
                {/* Affichage des fautes par type */}
                <div className="space-y-2 mb-3">
                  {/* Fautes jaunes */}
                  {yellowFaults.length > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-yellow-400 font-bold">Jaunes:</span>
                      {yellowFaults.map((f, i) => (
                        <span key={i} className="text-yellow-400">🟨</span>
                      ))}
                      <span className="text-xs text-gray-400">({yellowFaults.length})</span>
                    </div>
                  )}
                  
                  {/* Fautes rouges */}
                  {redFaults.length > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-red-500 font-bold">Rouges:</span>
                      {redFaults.map((f, i) => (
                        <span key={i} className="text-red-500">🟥</span>
                      ))}
                      <span className="text-xs text-gray-400">({redFaults.length})</span>
                    </div>
                  )}
                  
                  {/* Fautes noires */}
                  {blackFaults.length > 0 && (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-gray-200 font-bold">Noires:</span>
                      {blackFaults.map((f, i) => (
                        <span key={i} className="text-gray-200">⬛</span>
                      ))}
                      <span className="text-xs text-gray-400">({blackFaults.length})</span>
                    </div>
                  )}
                  
                  {/* Message si aucune faute */}
                  {yellowFaults.length === 0 && redFaults.length === 0 && blackFaults.length === 0 && (
                    <div className="text-center text-gray-500 text-xs">Aucune faute</div>
                  )}
                </div>

                {/* Boutons d'attribution */}
                <div className="grid grid-cols-2 gap-1">
                  <button 
                    onClick={() => setShowAttribution({ target: side as "left"|"right", type: "jaune" })} 
                    className="bg-yellow-500/20 text-yellow-400 border border-yellow-400 px-2 py-1 rounded text-xs font-bold hover:bg-yellow-500/30 transition-colors"
                  >
                    ⚡ Jaune
                  </button>
                  <button 
                    onClick={() => setShowAttribution({ target: side as "left"|"right", type: "rouge" })} 
                    className="bg-red-500/20 text-red-400 border border-red-400 px-2 py-1 rounded text-xs font-bold hover:bg-red-500/30 transition-colors"
                  >
                    ⚡ Rouge
                  </button>
                  <button 
                    onClick={() => setShowAttribution({ target: side as "left"|"right", type: "noir" })} 
                    className="col-span-2 bg-gray-500/20 text-gray-400 border border-gray-400 px-2 py-1 rounded text-xs font-bold hover:bg-gray-500/30 transition-colors"
                  >
                    ⚡ Noir
                  </button>
                </div>
                
                {/* Indicateur de danger (proche de la pénalité) */}
                {faultCounts.current[side as "left"|"right"].jaune === 1 && (
                  <div className="mt-2 text-center">
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded border border-yellow-500/40">
                      ⚠️ Attention! 1 carton jaune de plus = -1 HP
                    </span>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Bouton historique */}
      <div className="flex justify-center p-2 bg-black/20 border-t border-cyber-blue/30">
        <button 
          onClick={() => setShowFautes(true)} 
          className="px-4 py-2 bg-purple-500/30 text-purple-400 border border-purple-500 rounded-lg font-bold hover:bg-purple-500/40 transition-colors"
        >
          📋 Historique des fautes ({fautes.length})
        </button>
      </div>

      {/* Modal Attribution */}
      {showAttribution && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-lg z-50">
          <div className="bg-gradient-to-br from-cyber-dark via-cyber-purple to-cyber-navy p-6 rounded-xl border-2 border-cyber-blue max-w-md w-full text-center">
            <h2 className="text-cyber-blue text-xl font-bold mb-4">⚡ Attribution de Faute ⚡</h2>
            
            <div className="mb-4">
              <p className="text-white font-bold mb-2">
                {showAttribution.target === "left" ? player1 : player2}
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className={
                  showAttribution.type === "jaune" ? "text-yellow-400 text-2xl" :
                  showAttribution.type === "rouge" ? "text-red-500 text-2xl" : "text-gray-200 text-2xl"
                }>
                  {showAttribution.type === "jaune" ? "🟨" : showAttribution.type === "rouge" ? "🟥" : "⬛"}
                </span>
                <span className={
                  showAttribution.type === "jaune" ? "text-yellow-400 font-bold" :
                  showAttribution.type === "rouge" ? "text-red-500 font-bold" : "text-gray-200 font-bold"
                }>
                  Carton {showAttribution.type.charAt(0).toUpperCase() + showAttribution.type.slice(1)}
                </span>
              </div>
              
              {/* Avertissement sur les conséquences */}
              <div className="text-sm p-2 rounded-lg border mb-4">
                {showAttribution.type === "jaune" && (
                  <div className="text-yellow-300 bg-yellow-500/10 border-yellow-500/30">
                    <span className="font-bold">⚠️ Conséquence:</span> 2 cartons jaunes = -1 HP
                  </div>
                )}
                {showAttribution.type === "rouge" && (
                  <div className="text-red-300 bg-red-500/10 border-red-500/30">
                    <span className="font-bold">🚨 Conséquence:</span> Disqualification immédiate
                  </div>
                )}
                {showAttribution.type === "noir" && (
                  <div className="text-gray-300 bg-gray-500/10 border-gray-500/30">
                    <span className="font-bold">💀 Conséquence:</span> Disqualification immédiate
                  </div>
                )}
              </div>
            </div>

            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              className="w-full p-2 bg-black/70 border-2 border-cyber-blue rounded-lg text-white mb-4"
            >
              <option value="zone">🚫 Sortie de zone répétée</option>
              <option value="technique">⚔️ Technique interdite</option>
              <option value="antigame">🌀 Anti-jeu</option>
              <option value="respect">😤 Non respect</option>
              <option value="contact">👊 Contact excessif</option>
              <option value="contact">💥 Contact dangereux</option>
              <option value="contact">🙉 Refus d&apos;écouter l&apos;arbitre</option>
              <option value="contact">☠️ Mise en danger d&apos;autrui</option>
              <option value="materiel">🛡️ Problème matériel</option>
              <option value="comportement">🤬 Attitude non sportive</option>
            </select>
            
            <div className="flex gap-3">
              <button 
                onClick={confirmFaute} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors"
              >
                ⚡ Confirmer
              </button>
              <button 
                onClick={() => setShowAttribution(null)} 
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique */}
      {showFautes && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/80 backdrop-blur-lg z-50">
          <div className="bg-gradient-to-br from-cyber-dark via-cyber-purple to-cyber-navy p-6 rounded-xl border-2 border-cyber-blue max-w-2xl w-full">
            <h2 className="text-cyber-blue text-2xl font-bold mb-4 text-center">📋 Historique des Fautes 📋</h2>
            
            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                <div className="text-yellow-400 text-xl font-bold">{fautes.filter(f => f.type === "jaune").length}</div>
                <div className="text-xs text-yellow-300">Cartons Jaunes</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                <div className="text-red-400 text-xl font-bold">{fautes.filter(f => f.type === "rouge").length}</div>
                <div className="text-xs text-red-300">Cartons Rouges</div>
              </div>
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3 text-center">
                <div className="text-gray-300 text-xl font-bold">{fautes.filter(f => f.type === "noir").length}</div>
                <div className="text-xs text-gray-300">Cartons Noirs</div>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-2 mb-4">
              {fautes.length === 0 && (
                <p className="text-gray-300 text-center py-8">Aucune faute enregistrée</p>
              )}
              {fautes.map((f, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-black/40 border border-cyber-blue/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={
                      f.type === "jaune" ? "text-yellow-400" :
                      f.type === "rouge" ? "text-red-500" : "text-gray-200"
                    }>
                      {f.type === "jaune" ? "🟨" : f.type === "rouge" ? "🟥" : "⬛"}
                    </span>
                    <span className="text-white font-bold">{f.player}</span>
                  </div>
                  <div className="text-center">
                    <div className={
                      f.type === "jaune" ? "text-yellow-400 font-bold" :
                      f.type === "rouge" ? "text-red-500 font-bold" :
                      "text-gray-200 font-bold"
                    }>
                      {f.reason}
                    </div>
                    <div className="text-xs text-gray-400">{f.time}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    f.type === "jaune" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" :
                    f.type === "rouge" ? "bg-red-500/20 text-red-300 border border-red-500/40" :
                    "bg-gray-500/20 text-gray-300 border border-gray-500/40"
                  }`}>
                    {f.type.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setShowFautes(false)} 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
