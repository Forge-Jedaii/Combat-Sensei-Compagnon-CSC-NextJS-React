"use client";

import React from "react";
import Button from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="bg-black/90 border border-cyber-blue/40 rounded-2xl shadow-lg p-6 max-w-lg w-full text-center relative">
        <h2 className="text-cyber-blue text-xl sm:text-2xl font-bold mb-4 text-glow">{title}</h2>

        <div className="text-gray-200 mb-6">{children}</div>

        <Button onClick={onClose} className="bg-red-600/70 border-red-400">
          ❌ Fermer
        </Button>
      </div>
    </div>
  );
}
