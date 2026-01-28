"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserMode } from "@/components/context/UserModeContext";

export default function LoginPage() {
  const router = useRouter();

  const { mode, user, setMode, setUser } = useUserMode();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur de connexion");
      return;
    }

    // ✅ SOURCE DE VÉRITÉ : CONTEXT
    setUser(data);
    setMode("authenticated");

    // 🟡 optionnel / temporaire (reload plus tard)
    localStorage.setItem("user", JSON.stringify(data));

    router.push("/archives");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-gradient text-white">
      <div className="bg-black/60 p-8 rounded-xl w-80 space-y-4 border border-purple-500/40">
        <h1 className="text-xl font-bold text-center">🔐 Connexion</h1>

        <input
          placeholder="Nom d'utilisateur"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded bg-black border border-gray-600"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-black border border-gray-600"
        />

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          onClick={handleLogin}
          className="w-full p-2 rounded bg-purple-600 hover:bg-purple-500 transition"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}