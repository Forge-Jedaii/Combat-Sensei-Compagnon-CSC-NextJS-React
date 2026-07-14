"use client";

import React, { useEffect, useRef } from "react";
import Button from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cyber-blue/40 bg-black/90 p-6 text-center shadow-lg">
        <h2 id="modal-title" className="mb-4 text-xl font-bold text-cyber-blue text-glow sm:text-2xl">{title}</h2>

        <div className="text-gray-200 mb-6">{children}</div>

        <Button ref={closeButtonRef} type="button" onClick={onClose} className="bg-red-600/70 border-red-400">
          ❌ Fermer
        </Button>
      </div>
    </div>
  );
}
