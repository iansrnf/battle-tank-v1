"use client";

import { useEffect, useRef, useState } from "react";
import { POWERUP_TYPES, WORLD } from "./config";
import { getTankAudio } from "./audio";
import { drawGame } from "./render";
import {
  applyPowerUpToState,
  applyChatCommand,
  applySupporterBoost,
  getHudSnapshot,
  jumpToLevel,
  makeInitialState,
  spawnRandomPowerUp,
  startGameState,
  stepGame,
} from "./engine";
import { getAiKeys } from "./ai";

const BLOCKED_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);
const DEFAULT_AI_MODE = true;

function createAudioSnapshot(state) {
  return {
    mode: state.mode,
    running: state.running,
    won: state.won,
    level: state.level,
    player: {
      ultimateShieldTime: state.player.ultimateShieldTime,
      shieldHp: state.player.shieldHp,
    },
    bullets: state.bullets.map((bullet) => ({ owner: bullet.owner })),
    powerUps: state.powerUps.map((powerUp) => powerUp.id),
    explosions: state.explosions.map((explosion, index) => `${index}-${explosion.x}-${explosion.y}`),
    effects: {
      freeze: state.effects.freeze,
      scare: state.effects.scare,
      chatCommandTime: state.effects.chatCommandTime,
      chatImmunity: state.effects.chatImmunity,
    },
  };
}

export function useTankGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(startGameState());
  const keysRef = useRef(new Set());
  const rafRef = useRef(null);
  const lastFrameRef = useRef(0);
  const prevAudioStateRef = useRef(null);
  const aiModeRef = useRef(DEFAULT_AI_MODE);
  const [hud, setHud] = useState(() => getHudSnapshot(stateRef.current));
  const [aiMode, setAiMode] = useState(DEFAULT_AI_MODE);

  useEffect(() => {
    const audio = getTankAudio();

    const handleKeyDown = (event) => {
      if (BLOCKED_KEYS.has(event.code)) {
        event.preventDefault();
      }
      audio.unlock();
      keysRef.current.add(event.code);
    };

    const handleKeyUp = (event) => {
      keysRef.current.delete(event.code);
    };

    const handlePointerDown = () => {
      audio.unlock();
    };

    const loop = (timestamp) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const dt = Math.min((timestamp - lastFrameRef.current) / 1000, 0.05);
      lastFrameRef.current = timestamp;

      const inputKeys = aiModeRef.current ? getAiKeys(stateRef.current) : keysRef.current;
      const prevState = createAudioSnapshot(stateRef.current);
      stepGame(stateRef.current, inputKeys, dt);
      audio.sync(prevAudioStateRef.current ?? prevState, stateRef.current);
      prevAudioStateRef.current = createAudioSnapshot(stateRef.current);

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
    window.addEventListener("pointerdown", handlePointerDown);
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("pointerdown", handlePointerDown);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const syncHud = () => {
    setHud(getHudSnapshot(stateRef.current));
  };

  const resetGame = () => {
    stateRef.current = startGameState();
    prevAudioStateRef.current = createAudioSnapshot(stateRef.current);
    keysRef.current.clear();
    lastFrameRef.current = 0;
    syncHud();
  };

  const openMainMenu = () => {
    stateRef.current = makeInitialState();
    prevAudioStateRef.current = createAudioSnapshot(stateRef.current);
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

  const goToLevel = (level) => {
    jumpToLevel(stateRef.current, level);
    prevAudioStateRef.current = createAudioSnapshot(stateRef.current);
    keysRef.current.clear();
    lastFrameRef.current = 0;
    syncHud();
  };

  const triggerSupporterBoost = () => {
    applySupporterBoost(stateRef.current);
    syncHud();
  };

  const triggerChatCommand = (command) => {
    const applied = applyChatCommand(stateRef.current, command);
    if (applied) syncHud();
    return applied;
  };

  return {
    canvasRef,
    world: WORLD,
    hud,
    aiMode,
    grantPower,
    dropRandomPower,
    goToLevel,
    triggerChatCommand,
    triggerSupporterBoost,
    resetGame,
    openMainMenu,
    toggleAiMode,
  };
}
