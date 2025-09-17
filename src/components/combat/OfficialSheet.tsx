"use client";

import React, { useState, useEffect } from "react";

export default function OfficialSheet({ 
  isOpen = false, 
  onClose = () => {}, 
  combatData = null 
}) {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [verificationHash, setVerificationHash] = useState("");
  const [digitalTimestamp, setDigitalTimestamp] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('fr-FR'));
    setCurrentTime(now.toLocaleTimeString('fr-FR'));
    setDigitalTimestamp(now.toISOString());
    
    // Générer un hash de vérification simulé
    const hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setVerificationHash(hash.toUpperCase());
  }, []);

  const downloadSheet = () => {
    window.print();
  };

  const printSheet = () => {
    window.print();
  };

  const shareSheet = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Feuille de Combat Officielle',
        text: 'Résultats du combat Forge Je\'daii',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier !');
    }
  };

  if (!isOpen) return null;

  // Données par défaut si aucune donnée de combat n'est fournie
  const defaultData = {
    event: "Tournoi d'Entraînement",
    duration: "5 minutes",
    actualDuration: "3min 45s",
    arbitre: "Maître Yoda",
    combatId: "JD-2024-001",
    fighter1: {
      name: "Padawan Luke",
      finalHP: 7,
      damage: 3,
      faults: 1
    },
    fighter2: {
      name: "Padawan Leia",
      finalHP: 4,
      damage: 6,
      faults: 0
    },
    winner: "Padawan Leia",
    result: "Victoire par points"
  };

  const data = combatData || defaultData;

  return (
    <div className="fixed inset-0 bg-black/95 flex justify-center items-center z-50 backdrop-blur-lg p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white text-black p-6 sm:p-8 rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto" style={{fontFamily: "'Times New Roman', serif"}}>
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">📜 FEUILLE DE COMBAT OFFICIELLE 📜</h1>
          <h2 className="text-lg sm:text-xl font-semibold">FORGE JE&apos;DAII - COMBAT SENSEI</h2>
          <p className="text-sm mt-2">Document Officiel d&apos;Enregistrement de Combat</p>
        </div>

        {/* Combat Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-black p-4">
            <h3 className="font-bold text-lg mb-3 text-center bg-gray-200 p-2">INFORMATIONS DU COMBAT</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Date:</span>
                <span>{currentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Heure:</span>
                <span>{currentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Événement:</span>
                <span>{data.event}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Durée Limite:</span>
                <span>{data.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Durée Réelle:</span>
                <span>{data.actualDuration}</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-black p-4">
            <h3 className="font-bold text-lg mb-3 text-center bg-gray-200 p-2">ARBITRAGE</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Arbitre:</span>
                <span>{data.arbitre}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Certification:</span>
                <span>Maître Je&apos;daii</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">ID Combat:</span>
                <span>{data.combatId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Combatants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-green-600 p-4 bg-green-50">
            <h3 className="font-bold text-lg mb-3 text-center bg-green-200 p-2">🟢 COMBATTANT 1 (ZONE VERTE)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Nom:</span>
                <span className="font-bold">{data.fighter1.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">PV Initiaux:</span>
                <span>10</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">PV Finaux:</span>
                <span className="font-bold">{data.fighter1.finalHP}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Dégâts Infligés:</span>
                <span className="font-bold">{data.fighter1.damage}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Fautes:</span>
                <span>{data.fighter1.faults}</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-yellow-600 p-4 bg-yellow-50">
            <h3 className="font-bold text-lg mb-3 text-center bg-yellow-200 p-2">🟡 COMBATTANT 2 (ZONE DORÉE)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Nom:</span>
                <span className="font-bold">{data.fighter2.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">PV Initiaux:</span>
                <span>10</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">PV Finaux:</span>
                <span className="font-bold">{data.fighter2.finalHP}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Dégâts Infligés:</span>
                <span className="font-bold">{data.fighter2.damage}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Fautes:</span>
                <span>{data.fighter2.faults}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="border-4 border-black p-4 mb-6 bg-gray-100">
          <h3 className="font-bold text-xl mb-3 text-center">🏆 RÉSULTAT OFFICIEL 🏆</h3>
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{data.winner}</div>
            <div className="text-lg">{data.result}</div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="border-2 border-black p-4 text-center">
            <h4 className="font-bold mb-4">SIGNATURE ARBITRE</h4>
            <div className="border-b-2 border-black h-16 mb-2 flex items-end justify-center">
              <span className="text-2xl font-bold">⚖️</span>
            </div>
            <p className="text-sm">{data.arbitre}</p>
            <p className="text-xs">Arbitre Certifié</p>
          </div>

          <div className="border-2 border-green-600 p-4 text-center bg-green-50">
            <h4 className="font-bold mb-4">SIGNATURE COMBATTANT 1</h4>
            <div className="border-b-2 border-black h-16 mb-2 flex items-end justify-center">
              <span className="text-2xl font-bold">⚔️</span>
            </div>
            <p className="text-sm">{data.fighter1.name}</p>
            <p className="text-xs">Je&apos;daii Combattant</p>
          </div>

          <div className="border-2 border-yellow-600 p-4 text-center bg-yellow-50">
            <h4 className="font-bold mb-4">SIGNATURE COMBATTANT 2</h4>
            <div className="border-b-2 border-black h-16 mb-2 flex items-end justify-center">
              <span className="text-2xl font-bold">⚔️</span>
            </div>
            <p className="text-sm">{data.fighter2.name}</p>
            <p className="text-xs">Je&apos;daii Combattant</p>
          </div>
        </div>

        {/* Digital Verification */}
        <div className="border-2 border-blue-600 p-4 mb-6 bg-blue-50">
          <h3 className="font-bold text-lg mb-3 text-center">🔐 VÉRIFICATION NUMÉRIQUE 🔐</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Hash de Vérification:</span><br />
              <code className="bg-gray-200 p-1 rounded text-xs break-all">{verificationHash}</code>
            </div>
            <div>
              <span className="font-semibold">Timestamp:</span><br />
              <code className="bg-gray-200 p-1 rounded text-xs break-all">{digitalTimestamp}</code>
            </div>
          </div>
          <p className="text-xs mt-2 text-center text-gray-600">
            Ce document est authentifié par signature numérique et peut être vérifié via le système Forge Je&apos;daii
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 border-t-2 border-black pt-4">
          <p>Document généré automatiquement par le système Forge Je&apos;daii - Combat Sensei</p>
          <p>© 2024 Forge Je&apos;daii Academy - Tous droits réservés</p>
          <p className="mt-2 font-semibold">⚔️ Que la Force soit avec vous ! ⚔️</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 pt-4 border-t-2 border-black">
          <button 
            onClick={downloadSheet} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
          >
            📄 Télécharger PDF
          </button>
          <button 
            onClick={printSheet} 
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-all"
          >
            🖨️ Imprimer
          </button>
          <button 
            onClick={shareSheet} 
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-all"
          >
            📤 Partager
          </button>
          <button 
            onClick={onClose} 
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition-all"
          >
            ✖️ Fermer
          </button>
        </div>
      </div>
    </div>
  );
}