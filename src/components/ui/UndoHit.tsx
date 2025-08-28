"use client";

import React from "react";

type UndoButtonProps = {
  onUndo: () => void;
  disabled?: boolean;
  className?: string;
  text?: string;
};

export default function UndoHit({ 
  onUndo, 
  disabled = false, 
  className = "",
  text = "↻ Annuler la dernière touche"
}: UndoButtonProps) {
  return (
    <button
      onClick={onUndo}
      disabled={disabled}
      className={`
        px-3 sm:px-4 py-2 sm:py-3 
        bg-gradient-to-r from-red-600/60 to-red-700/60 
        border border-red-400/80 
        text-red-200 text-xs sm:text-sm font-bold 
        rounded-lg transition-all duration-200
        hover:from-red-500/70 hover:to-red-600/70 
        hover:border-red-300 hover:text-white
        hover:scale-105 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed 
        disabled:hover:scale-100 disabled:hover:shadow-none
        text-glow-sm whitespace-nowrap
        min-w-fit max-w-xs truncate
        ${className}
      `}
    >
      {text}
    </button>
  );
}