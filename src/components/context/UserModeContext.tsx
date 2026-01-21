"use client";

import React, { createContext, useContext, useState } from "react";

type UserMode = "guest" | "authenticated";

interface UserModeContextType {
  mode: UserMode | null;
  setMode: (mode: UserMode) => void;
}

const UserModeContext = createContext<UserModeContextType | null>(null);

export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<UserMode | null>(null);

  return (
    <UserModeContext.Provider value={{ mode, setMode }}>
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  const ctx = useContext(UserModeContext);
  if (!ctx) throw new Error("useUserMode must be used inside UserModeProvider");
  return ctx;
}
