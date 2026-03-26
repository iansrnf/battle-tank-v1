"use client";

import { useEffect, useRef, useState } from "react";
import { WORLD } from "./config";
import { drawGame } from "./render";
import { getHudSnapshot, makeInitialState, startGameState, stepGame } from "./engine";

const BLOCKED_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);

export function useTankGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(makeInitialState());
  const keysRef = useRef(new Set());
  const rafRef = useRef(null);
  const lastFrameRef = useRef(0);
  const [hud, setHud] = useState(() => getHudSnapshot(stateRef.current));

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

      stepGame(stateRef.current, keysRef.current, dt);

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

  return {
    canvasRef,
    world: WORLD,
    hud,
    resetGame,
    openMainMenu,
  };
}
