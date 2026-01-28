"use client";

import React, { createContext, useContext, useState } from "react";

interface User {
  _id: string;
  name: string;
  email?: string;
  points: number;
  achievements: { _id: string }[];
}

type UserMode = "guest" | "authenticated";

interface UserModeContextType {
  mode: UserMode | null;
  setMode: (mode: UserMode) => void;

  user: User | null;
  setUser: (user: User | null) => void;
}

const UserModeContext = createContext<UserModeContextType | null>(null);

export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<UserMode | null>(null);
  const [user, setUser] = useState<User | null>(null); 

  return (
    <UserModeContext.Provider
      value={{ mode, setMode, user, setUser }} 
    >
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  const ctx = useContext(UserModeContext);
  if (!ctx) throw new Error("useUserMode must be used inside UserModeProvider");
  return ctx;
}