"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CombatWorkflowClient } from "@/services/combat-workflow.client";
import type { PersistedCombat } from "@/repositories/combat-workflow.repository";
import type { Json, MatchMode, MatchResultType } from "@/types/database.types";

type Options = { mode?: MatchMode; player1: string; player2: string; player1UserId?: string; player2UserId?: string; player1StartingHealth?: number; player2StartingHealth?: number; duration: number; eventName?: string; tournamentId?: string; settings?: Json };

export function usePersistentCombat(options: Options) {
  const client = useMemo(() => new CombatWorkflowClient(), []);
  const [combat, setCombat] = useState<PersistedCombat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialization = useRef<Promise<void> | null>(null);
  const storageKey = options.mode ? `csc:active-match:${options.mode}` : null;

  useEffect(() => {
    if (!options.mode || !storageKey || initialization.current) return;
    const matchMode = options.mode;
    initialization.current = (async () => {
      try {
        const storedMatchId = localStorage.getItem(storageKey);
        if (storedMatchId) {
          const resumed = await client.resume(storedMatchId);
          if (resumed.match.status === "active") {
            setCombat(resumed);
            return;
          }
          localStorage.removeItem(storageKey);
        }
        const sessionKey = `${storageKey}:session`;
        const clientSessionId = localStorage.getItem(sessionKey) ?? crypto.randomUUID();
        localStorage.setItem(sessionKey, clientSessionId);
        const created = await client.start({
          clientSessionId,
          durationSeconds: options.duration,
          eventName: options.eventName,
          mode: matchMode,
          participants: [
            { name: options.player1, userId: options.player1UserId, startingHealth: options.player1StartingHealth ?? 10 },
            { name: options.player2, userId: options.player2UserId, startingHealth: options.player2StartingHealth ?? 10 },
          ],
          settings: options.settings,
          tournamentId: options.tournamentId,
        });
        localStorage.setItem(storageKey, created.match.id);
        setCombat(created);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Le combat n’a pas pu être enregistré.");
      }
    })();
  }, [client, options.duration, options.eventName, options.mode, options.player1, options.player1StartingHealth, options.player1UserId, options.player2, options.player2StartingHealth, options.player2UserId, options.settings, options.tournamentId, storageKey]);

  const participant = useCallback((position: number) => combat?.participants.find((item) => item.position === position), [combat]);
  const recordHealth = useCallback(async (position: number, health: number, eventType: string, payload?: Json) => {
    const target = participant(position);
    if (!combat || !target) return;
    try { await client.recordHealth(combat.match.id, target.id, health, eventType, payload); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Échec de sauvegarde."); }
  }, [client, combat, participant]);
  const recordFault = useCallback(async (position: number, input: Omit<Parameters<CombatWorkflowClient["recordFault"]>[1], "participantId">) => {
    const target = participant(position);
    if (!combat || !target) return;
    try { await client.recordFault(combat.match.id, { ...input, participantId: target.id }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Échec de sauvegarde de la faute."); }
  }, [client, combat, participant]);
  const finish = useCallback(async (winnerPosition: number | null, resultType: MatchResultType) => {
    if (!combat || !storageKey) return null;
    const result = await client.finish(combat.match.id, resultType, winnerPosition ? participant(winnerPosition)?.id ?? null : null);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}:session`);
    setCombat(result);
    window.dispatchEvent(new Event("csc:data-refresh"));
    return result;
  }, [client, combat, participant, storageKey]);

  return { combat, error, finish, recordFault, recordHealth };
}
