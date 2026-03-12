"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  BattleEvent,
  BattleEventType,
  BattleLogEntry,
  GamePhase,
  Team,
  Warrior,
  WarriorAttackPayload,
  WarriorPayload,
  GameOverPayload,
} from "@/types/battle";

const MAX_HEALTH = 150;

export function useBattle() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [warriors, setWarriors] = useState<Map<string, Warrior>>(new Map());
  const [battleLogs, setBattleLogs] = useState<BattleLogEntry[]>([]);
  const [winner, setWinner] = useState<string | undefined>();
  const [score, setScore] = useState<
    { red: number; blue: number } | undefined
  >();
  const [isConnected, setIsConnected] = useState(false);
  const [attackAnimations, setAttackAnimations] = useState<
    Map<string, { target: string; damage: number }>
  >(new Map());

  const socketRef = useRef<Socket | null>(null);

  const addLog = useCallback(
    (type: BattleEventType, message: string, team?: Team) => {
      const entry: BattleLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: Date.now(),
        team,
      };
      setBattleLogs((prev) => [entry, ...prev].slice(0, 100));
    },
    [],
  );

  const handlePodAdded = useCallback(
    (payload: WarriorPayload) => {
      // Set phase to setup when first pod arrives
      setPhase((prev) => (prev === "idle" ? "setup" : prev));

      const warrior: Warrior = {
        podName: payload.podName,
        team: payload.team as Team,
        status: "pending",
        health: MAX_HEALTH,
        maxHealth: MAX_HEALTH,
        isAttacking: false,
      };
      setWarriors((prev) => new Map(prev).set(payload.podName, warrior));
      addLog(
        BattleEventType.POD_ADDED,
        `${payload.podName} deployed`,
        payload.team as Team,
      );
    },
    [addLog],
  );

  const handleWarriorReady = useCallback(
    (payload: WarriorPayload) => {
      // Set phase to setup when first pod arrives
      setPhase((prev) => (prev === "idle" ? "setup" : prev));

      setWarriors((prev) => {
        const newMap = new Map(prev);
        const existingWarrior = newMap.get(payload.podName);

        console.log(
          "[v0] handleWarriorReady called:",
          payload.podName,
          "existing:",
          !!existingWarrior,
          "payload:",
          payload,
        );

        // If warrior doesn't exist, create it and set to ready
        // This handles the case where WARRIOR_READY is received without POD_ADDED first
        if (!existingWarrior) {
          const newWarrior: Warrior = {
            podName: payload.podName,
            team: payload.team as Team,
            status:
              payload.status === "ready"
                ? "ready"
                : payload.status === "respawned"
                  ? "alive"
                  : "pending",
            health: MAX_HEALTH,
            maxHealth: MAX_HEALTH,
            isAttacking: false,
          };
          newMap.set(payload.podName, newWarrior);
          console.log(
            "[v0] Created new warrior from WARRIOR_READY:",
            payload.podName,
            "warriors count:",
            newMap.size,
          );
        } else {
          // Update existing warrior
          if (payload.status === "respawned") {
            newMap.set(payload.podName, {
              ...existingWarrior,
              status: "alive",
              health: existingWarrior.maxHealth,
            });
          } else {
            newMap.set(payload.podName, {
              ...existingWarrior,
              status: "ready",
            });
          }
        }
        return newMap;
      });

      if (payload.status === "respawned") {
        addLog(
          BattleEventType.WARRIOR_READY,
          `${payload.podName} respawned!`,
          payload.team as Team,
        );
      } else {
        addLog(
          BattleEventType.WARRIOR_READY,
          `${payload.podName} ready for battle!`,
          payload.team as Team,
        );
      }
    },
    [addLog],
  );

  const handleWarriorAttack = useCallback(
    (payload: WarriorAttackPayload) => {
      // Add attack animation
      setAttackAnimations((prev) => {
        const newMap = new Map(prev);
        newMap.set(payload.attacker, {
          target: payload.target,
          damage: payload.damage,
        });
        return newMap;
      });

      // Update target health
      setWarriors((prev) => {
        const newMap = new Map(prev);
        const target = newMap.get(payload.target);
        const attacker = newMap.get(payload.attacker);

        if (target) {
          newMap.set(payload.target, {
            ...target,
            health: payload.remainingHealth,
            lastDamageReceived: payload.damage,
          });
        }
        if (attacker) {
          newMap.set(payload.attacker, {
            ...attacker,
            isAttacking: true,
            attackTarget: payload.target,
          });
        }
        return newMap;
      });

      // Clear attack animation after delay
      setTimeout(() => {
        setAttackAnimations((prev) => {
          const newMap = new Map(prev);
          newMap.delete(payload.attacker);
          return newMap;
        });
        setWarriors((prev) => {
          const newMap = new Map(prev);
          const attacker = newMap.get(payload.attacker);
          if (attacker) {
            newMap.set(payload.attacker, {
              ...attacker,
              isAttacking: false,
              attackTarget: undefined,
            });
          }
          const target = newMap.get(payload.target);
          if (target) {
            newMap.set(payload.target, {
              ...target,
              lastDamageReceived: undefined,
            });
          }
          return newMap;
        });
      }, 500);

      addLog(
        BattleEventType.WARRIOR_ATTACK,
        `${payload.attacker} attacks ${payload.target} for ${payload.damage} damage!`,
        payload.attackerTeam as Team,
      );
    },
    [addLog],
  );

  const handleWarriorDied = useCallback(
    (payload: WarriorPayload) => {
      const isRespawn = payload.status === "respawned";

      setWarriors((prev) => {
        const newMap = new Map(prev);
        const warrior = newMap.get(payload.podName);
        if (warrior) {
          if (isRespawn) {
            // Respawn with FULL health
            newMap.set(payload.podName, {
              ...warrior,
              status: "alive",
              health: warrior.maxHealth,
            });
          } else {
            newMap.set(payload.podName, {
              ...warrior,
              status: "dead",
              health: 0,
            });
            // Start respawn timer
            setTimeout(() => {
              setWarriors((p) => {
                const nm = new Map(p);
                const w = nm.get(payload.podName);
                if (w && w.status === "dead") {
                  nm.set(payload.podName, { ...w, status: "respawning" });
                }
                return nm;
              });
            }, 500);
          }
        }
        return newMap;
      });

      if (isRespawn) {
        addLog(
          BattleEventType.WARRIOR_READY,
          `${payload.podName} respawned!`,
          payload.team as Team,
        );
      } else {
        addLog(
          BattleEventType.WARRIOR_DIED,
          `${payload.podName} has fallen!`,
          payload.team as Team,
        );
      }
    },
    [addLog],
  );

  const handleGameStarted = useCallback(() => {
    setPhase("battle");
    // Set all ready warriors to alive
    setWarriors((prev) => {
      const newMap = new Map(prev);
      newMap.forEach((warrior, key) => {
        if (warrior.status === "ready") {
          newMap.set(key, { ...warrior, status: "alive" });
        }
      });
      return newMap;
    });
    addLog(BattleEventType.GAME_STARTED, "The battle has begun!");
  }, [addLog]);

  const handleGameOver = useCallback(
    (payload: GameOverPayload) => {
      setPhase("gameover");
      setWinner(payload.winner);
      setScore(payload.score);
      addLog(
        BattleEventType.GAME_OVER,
        `${payload.winner.toUpperCase()} team wins!`,
      );
    },
    [addLog],
  );

  const handleBattleEvent = useCallback(
    (event: BattleEvent) => {
      switch (event.type) {
        case BattleEventType.POD_ADDED:
          handlePodAdded(event.payload);
          break;
        case BattleEventType.WARRIOR_READY:
          handleWarriorReady(event.payload);
          break;
        case BattleEventType.WARRIOR_ATTACK:
          handleWarriorAttack(event.payload);
          break;
        case BattleEventType.WARRIOR_DIED:
          handleWarriorDied(event.payload);
          break;
        case BattleEventType.GAME_STARTED:
          handleGameStarted();
          break;
        case BattleEventType.GAME_OVER:
          handleGameOver(event.payload);
          break;
      }
    },
    [
      handlePodAdded,
      handleWarriorReady,
      handleWarriorAttack,
      handleWarriorDied,
      handleGameStarted,
      handleGameOver,
    ],
  );

  const handlerRef = useRef(handleBattleEvent);
  handlerRef.current = handleBattleEvent;
  useEffect(() => {
    handlerRef.current = handleBattleEvent;
  }, [handleBattleEvent]);

  // Connect to socket
  useEffect(() => {
    const socket = io(`${apiUrl}/battle`, {
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("[v0] Connected - Requesting current state...");
      socket.emit("request_sync");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[v0] Disconnected from battle socket");
    });

    socket.on("battle_update", (event: BattleEvent) => {
      console.log("[v0] Battle event received:", event);
      handlerRef.current(event);
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, handleBattleEvent]);

  const allWarriorsReady = useCallback(() => {
    if (warriors.size === 0) return false;
    return Array.from(warriors.values()).every((w) => w.status === "ready");
  }, [warriors]);

  const setupBattle = useCallback(
    async (battleName: string, redReplicas: number, blueReplicas: number) => {
      setPhase("setup");
      setWarriors(new Map());
      setBattleLogs([]);
      setWinner(undefined);
      setScore(undefined);

      try {
        const response = await fetch(`${apiUrl}/battle/setup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ battleName, redReplicas, blueReplicas }),
        });

        if (!response.ok) {
          throw new Error("Failed to setup battle");
        }

        addLog(
          BattleEventType.GAME_STARTED,
          `Setting up battle: ${battleName}`,
        );
      } catch (error) {
        console.error("[v0] Setup error:", error);
        setPhase("idle");
      }
    },
    [apiUrl, addLog],
  );

  // Start battle
  const startBattle = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/battle/start`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to start battle");
      }
    } catch (error) {
      console.error("[v0] Start error:", error);
    }
  }, [apiUrl]);

  const resetGame = useCallback(() => {
    window.location.href = "/";
  }, []);

  // Update phase when all warriors are ready
  useEffect(() => {
    console.log(
      `[Phase Check] Current: ${phase}, Warriors: ${warriors.size}, Ready: ${allWarriorsReady()}`,
    );

    if (phase === "setup" && warriors.size > 0 && allWarriorsReady()) {
      setPhase("ready");
    }
  }, [phase, warriors, allWarriorsReady]);

  // Get warriors by team
  const getTeamWarriors = useCallback(
    (team: Team) => {
      return Array.from(warriors.values()).filter((w) => w.team === team);
    },
    [warriors],
  );

  // Get alive count by team
  const getAliveCount = useCallback(
    (team: Team) => {
      return Array.from(warriors.values()).filter(
        (w) =>
          w.team === team && (w.status === "alive" || w.status === "ready"),
      ).length;
    },
    [warriors],
  );

  return {
    phase,
    warriors,
    battleLogs,
    winner,
    score,
    isConnected,
    attackAnimations,
    setupBattle,
    startBattle,
    resetGame,
    getTeamWarriors,
    getAliveCount,
    allWarriorsReady,
  };
}
