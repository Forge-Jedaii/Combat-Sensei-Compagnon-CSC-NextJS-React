"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
}

export default function PwaInstaller() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }

    const standalone = isStandalone();
    setInstalled(standalone);
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setInstalled(false);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowIosHelp(false);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed || (!installPrompt && !isIos)) return null;

  return (
    <aside className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[100] mx-auto max-w-sm rounded-xl border border-cyan-400/50 bg-black/90 p-3 text-sm text-white shadow-2xl backdrop-blur-md" aria-label="Installation de l’application">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-cyan-300">Installer CSC</p>
          <p className="text-xs text-gray-300">Accès rapide depuis votre écran d’accueil.</p>
        </div>
        <button
          type="button"
          className="rounded-lg bg-cyan-600 px-3 py-2 font-bold hover:bg-cyan-500"
          onClick={() => {
            if (installPrompt) {
              void installPrompt.prompt().then(() => installPrompt.userChoice).then(({ outcome }) => {
                if (outcome === "accepted") setInstalled(true);
                setInstallPrompt(null);
              });
            } else {
              setShowIosHelp(true);
            }
          }}
        >
          Installer
        </button>
      </div>
      {showIosHelp && (
        <p role="status" className="mt-3 border-t border-gray-700 pt-3 text-xs text-gray-200">
          Sur Safari : touchez Partager, puis « Sur l’écran d’accueil » et confirmez avec « Ajouter ».
        </p>
      )}
    </aside>
  );
}
