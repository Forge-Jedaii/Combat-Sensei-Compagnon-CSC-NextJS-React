"use client";
import { useRef, useCallback } from "react";

const sounds: Record<string, string> = {
  fightTheme: "/sounds/fight-theme.mp3",
  hit: "/sounds/hit.mp3",
  victory: "/sounds/victory.mp3",
};

export function useAudio() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const playSound = useCallback((key: string) => {
    if (!sounds[key]) return;

    if (!audioRefs.current[key]) {
      audioRefs.current[key] = new Audio(sounds[key]);
    }

    audioRefs.current[key].currentTime = 0;
    audioRefs.current[key].play().catch((err) => {
      console.error("Error playing sound:", err);
    });
  }, []);

  const stopSound = useCallback((key: string) => {
    if (audioRefs.current[key]) {
      audioRefs.current[key].pause();
      audioRefs.current[key].currentTime = 0;
    }
  }, []);

  return { playSound, stopSound };
}
