"use client";

import { useEffect, useRef, useState } from "react";
import { POWERUP_TYPES, WORLD } from "./config";
import { drawGame } from "./render";
import { applyPowerUpToState, getHudSnapshot, makeInitialState, spawnRandomPowerUp, startGameState, stepGame } from "./engine";
import { getAiKeys } from "./ai";

const BLOCKED_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);
const DEFAULT_AI_MODE = true;

export function useTankGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(makeInitialState());
  const keysRef = useRef(new Set());
  const rafRef = useRef(null);
  const lastFrameRef = useRef(0);
  const aiModeRef = useRef(DEFAULT_AI_MODE);
  const [hud, setHud] = useState(() => getHudSnapshot(stateRef.current));
  const [aiMode, setAiMode] = useState(DEFAULT_AI_MODE);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (BLOCKED_KEYS.has(event.code)) {
        event.preventDefault();
      }
      keysRef.current.add(event.code);
    };

    const handleKeyUp = (event) => {
      keysRef.current.delete(event.code);
    };

    const loop = (timestamp) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const dt = Math.min((timestamp - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = timestamp;

      const inputKeys = aiModeRef.current ? getAiKeys(stateRef.current) : keysRef.current;
      stepGame(stateRef.current, inputKeys, dt);

      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext("2d");
        if (context) drawGame(context, stateRef.current);
      }

      setHud(getHudSnapshot(stateRef.current));
      rafRef.current = window.requestAnimationFrame(loop);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const syncHud = () => {
    setHud(getHudSnapshot(stateRef.current));
  };

  const resetGame = () => {
    stateRef.current = startGameState();
    keysRef.current.clear();
    lastFrameRef.current = 0;
    syncHud();
  };

  const openMainMenu = () => {
    stateRef.current = makeInitialState();
    keysRef.current.clear();
    lastFrameRef.current = 0;
    syncHud();
  };

  const toggleAiMode = () => {
    keysRef.current.clear();
    setAiMode((current) => {
      const next = !current;
      aiModeRef.current = next;
      return next;
    });
  };

  const grantPower = (type) => {
    if (!POWERUP_TYPES.includes(type)) return;
    applyPowerUpToState(stateRef.current, type);
    syncHud();
  };

  const dropRandomPower = () => {
    spawnRandomPowerUp(stateRef.current);
    syncHud();
  };

  return {
    canvasRef,
    world: WORLD,
    hud,
    aiMode,
    grantPower,
    dropRandomPower,
    resetGame,
    openMainMenu,
    toggleAiMode,
  };
}
