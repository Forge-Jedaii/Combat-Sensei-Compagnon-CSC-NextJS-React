"use client";

import React, { useState, useEffect } from "react";

interface TimerProps {
  duration: number; // en secondes
  paused?: boolean;
  onEnd?: () => void;
  compact?: boolean;
}

export default function Timer({ duration, paused = true, onEnd, compact = false }: TimerProps) {
  const [time, setTime] = useState(duration);
  const [isRunning, setIsRunning] = useState(!paused);

  useEffect(() => {
    setIsRunning(!paused);
  }, [paused]);

  useEffect(() => {
    if (!isRunning) return;
    if (time <= 0) {
      onEnd?.();
      setIsRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, time, onEnd]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <span className={compact ? "text-lg sm:text-xl font-mono" : "text-2xl sm:text-3xl font-mono"}>
      {formatTime(time)}
    </span>
  );
}
