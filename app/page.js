"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const WORLD = {
  width: 832,
  height: 640,
  tankSize: 28,
};

const DIR_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const LEVEL_BRICKS = [
  [
    { x: 128, y: 128, w: 96, h: 32 },
    { x: 608, y: 128, w: 96, h: 32 },
    { x: 288, y: 224, w: 256, h: 32 },
    { x: 96, y: 320, w: 128, h: 32 },
    { x: 608, y: 320, w: 128, h: 32 },
    { x: 256, y: 448, w: 64, h: 32 },
    { x: 512, y: 448, w: 64, h: 32 },
  ],
  [
    { x: 96, y: 160, w: 192, h: 32 },
    { x: 544, y: 160, w: 192, h: 32 },
    { x: 304, y: 96, w: 224, h: 32 },
    { x: 304, y: 256, w: 224, h: 32 },
    { x: 160, y: 384, w: 160, h: 32 },
    { x: 512, y: 384, w: 160, h: 32 },
  ],
  [
    { x: 192, y: 192, w: 96, h: 32 },
    { x: 544, y: 192, w: 96, h: 32 },
    { x: 320, y: 192, w: 192, h: 32 },
    { x: 352, y: 320, w: 128, h: 32 },
    { x: 224, y: 448, w: 128, h: 32 },
    { x: 480, y: 448, w: 128, h: 32 },
  ],
  [
    { x: 80, y: 128, w: 128, h: 32 },
    { x: 304, y: 128, w: 224, h: 32 },
    { x: 624, y: 128, w: 128, h: 32 },
    { x: 208, y: 256, w: 96, h: 32 },
    { x: 528, y: 256, w: 96, h: 32 },
    { x: 80, y: 384, w: 224, h: 32 },
    { x: 528, y: 384, w: 224, h: 32 },
  ],
  [
    { x: 96, y: 96, w: 96, h: 32 },
    { x: 640, y: 96, w: 96, h: 32 },
    { x: 224, y: 176, w: 384, h: 32 },
    { x: 96, y: 272, w: 192, h: 32 },
    { x: 544, y: 272, w: 192, h: 32 },
    { x: 320, y: 352, w: 192, h: 32 },
    { x: 224, y: 464, w: 128, h: 32 },
    { x: 480, y: 464, w: 128, h: 32 },
  ],
  [
    { x: 160, y: 96, w: 96, h: 32 },
    { x: 576, y: 96, w: 96, h: 32 },
    { x: 96, y: 192, w: 640, h: 32 },
    { x: 224, y: 304, w: 96, h: 32 },
    { x: 512, y: 304, w: 96, h: 32 },
    { x: 320, y: 400, w: 192, h: 32 },
    { x: 96, y: 496, w: 192, h: 32 },
    { x: 544, y: 496, w: 192, h: 32 },
  ],
  [
    { x: 96, y: 128, w: 128, h: 32 },
    { x: 608, y: 128, w: 128, h: 32 },
    { x: 256, y: 128, w: 320, h: 32 },
    { x: 160, y: 240, w: 128, h: 32 },
    { x: 544, y: 240, w: 128, h: 32 },
    { x: 320, y: 320, w: 192, h: 32 },
    { x: 224, y: 432, w: 128, h: 32 },
    { x: 480, y: 432, w: 128, h: 32 },
  ],
  [
    { x: 80, y: 112, w: 192, h: 32 },
    { x: 560, y: 112, w: 192, h: 32 },
    { x: 336, y: 112, w: 160, h: 32 },
    { x: 144, y: 224, w: 128, h: 32 },
    { x: 560, y: 224, w: 128, h: 32 },
    { x: 304, y: 288, w: 224, h: 32 },
    { x: 80, y: 400, w: 224, h: 32 },
    { x: 528, y: 400, w: 224, h: 32 },
    { x: 336, y: 496, w: 160, h: 32 },
  ],
  [
    { x: 96, y: 96, w: 640, h: 32 },
    { x: 96, y: 208, w: 160, h: 32 },
    { x: 576, y: 208, w: 160, h: 32 },
    { x: 288, y: 256, w: 256, h: 32 },
    { x: 96, y: 352, w: 256, h: 32 },
    { x: 480, y: 352, w: 256, h: 32 },
    { x: 288, y: 464, w: 256, h: 32 },
  ],
  [
    { x: 64, y: 96, w: 160, h: 32 },
    { x: 608, y: 96, w: 160, h: 32 },
    { x: 256, y: 96, w: 320, h: 32 },
    { x: 96, y: 208, w: 128, h: 32 },
    { x: 608, y: 208, w: 128, h: 32 },
    { x: 288, y: 224, w: 256, h: 32 },
    { x: 160, y: 336, w: 160, h: 32 },
    { x: 512, y: 336, w: 160, h: 32 },
    { x: 320, y: 432, w: 192, h: 32 },
    { x: 224, y: 528, w: 384, h: 32 },
  ],
];

const LEVELS = [
  { label: "Level 1", count: 6, hp: 1, speedMin: 95, speedMax: 130, shootMin: 0.8, shootMax: 2.3, score: 100 },
  { label: "Level 2", count: 8, hp: 1, speedMin: 115, speedMax: 150, shootMin: 0.7, shootMax: 1.9, score: 125 },
  { label: "Level 3 Boss", boss: true, score: 500 },
  { label: "Level 4", count: 10, hp: 2, speedMin: 120, speedMax: 165, shootMin: 0.65, shootMax: 1.6, score: 150 },
  { label: "Level 5", count: 12, hp: 2, speedMin: 135, speedMax: 180, shootMin: 0.55, shootMax: 1.45, score: 175 },
  { label: "Level 6", count: 12, hp: 2, speedMin: 145, speedMax: 195, shootMin: 0.5, shootMax: 1.25, score: 190 },
  { label: "Level 7", count: 13, hp: 2, speedMin: 155, speedMax: 205, shootMin: 0.45, shootMax: 1.15, score: 205 },
  { label: "Level 8", count: 14, hp: 3, speedMin: 160, speedMax: 210, shootMin: 0.42, shootMax: 1.05, score: 220 },
  { label: "Level 9", count: 15, hp: 3, speedMin: 170, speedMax: 220, shootMin: 0.38, shootMax: 0.95, score: 240 },
  { label: "Level 10", count: 16, hp: 3, speedMin: 180, speedMax: 230, shootMin: 0.35, shootMax: 0.9, score: 260 },
];

const POWERUP_TYPES = ["shield", "rapidfire", "spread", "extraLife"];
const POWERUP_STYLE = {
  shield: { color: "#65b6ff", label: "S", duration: 20 },
  rapidfire: { color: "#ff9f43", label: "R", duration: 10 },
  spread: { color: "#a8ff60", label: "P", duration: 12 },
  extraLife: { color: "#ff5f8f", label: "+1", duration: 0 },
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function rectFromTank(tank) {
  const size = tank.size ?? WORLD.tankSize;
  return {
    x: tank.x - size / 2,
    y: tank.y - size / 2,
    w: size,
    h: size,
  };
}

function randomDir() {
  const dirs = ["up", "down", "left", "right"];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

function getLevelBricks(level) {
  return LEVEL_BRICKS[level - 1] ?? LEVEL_BRICKS[LEVEL_BRICKS.length - 1];
}

function buildEnemiesForLevel(level) {
  const cfg = LEVELS[level - 1];
  if (!cfg) return [];

  if (cfg.boss) {
    return [
      {
        id: `boss-${level}`,
        x: WORLD.width / 2,
        y: 88,
        dir: "down",
        speed: 120,
        changeTimer: 0.55,
        shootTimer: 0.45,
        hp: 12,
        score: cfg.score,
        isBoss: true,
        canDropPowerUp: true,
        size: 44,
      },
    ];
  }

  const enemies = [];
  const dropSlots = Math.max(1, Math.floor(cfg.count * 0.35));
  const dropIndexes = new Set();
  while (dropIndexes.size < dropSlots) {
    dropIndexes.add(Math.floor(Math.random() * cfg.count));
  }
  const safeWidth = WORLD.width - 120;
  const spacing = cfg.count > 1 ? safeWidth / (cfg.count - 1) : 0;
  for (let i = 0; i < cfg.count; i += 1) {
    enemies.push({
      id: `l${level}-e-${i}`,
      x: 60 + i * spacing,
      y: 72 + (i % 2) * 16,
      dir: "down",
      speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
      changeTimer: 0.4 + Math.random() * 1,
      shootTimer: cfg.shootMin + Math.random() * (cfg.shootMax - cfg.shootMin),
      hp: cfg.hp,
      score: cfg.score,
      canDropPowerUp: dropIndexes.has(i),
    });
  }

  return enemies;
}

function makeInitialState() {
  const level = 1;

  return {
    running: true,
    won: false,
    score: 0,
    lives: 3,
    level,
    maxLevel: LEVELS.length,
    bricks: getLevelBricks(level),
    player: {
      x: WORLD.width / 2,
      y: WORLD.height - 70,
      dir: "up",
      speed: 180,
      shootCd: 0,
      invincible: 0,
    },
    enemies: buildEnemiesForLevel(level),
    bullets: [],
    powerUps: [],
    effects: {
      shield: 0,
      rapidfire: 0,
      spread: 0,
    },
    explosions: [],
  };
}

export default function Home() {
  const canvasRef = useRef(null);
  const stateRef = useRef(makeInitialState());
  const keysRef = useRef(new Set());
  const rafRef = useRef(null);
  const lastRef = useRef(0);
  const modeRef = useRef("menu");

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [enemyLeft, setEnemyLeft] = useState(stateRef.current.enemies.length);
  const [activePowerUps, setActivePowerUps] = useState("None");
  const [status, setStatus] = useState("Main Menu");
  const [showMenu, setShowMenu] = useState(true);
  const isTerminalStatus = status === "Game Over" || status === "Victory";

  useEffect(() => {
    const down = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current.add(e.code);
    };

    const up = (e) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const loop = (ts) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;

      tick(dt);
      draw();

      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const resetGame = () => {
    stateRef.current = makeInitialState();
    setScore(0);
    setLives(3);
    setLevel(1);
    setEnemyLeft(stateRef.current.enemies.length);
    setActivePowerUps("None");
    setStatus("Level 1");
    modeRef.current = "play";
    setShowMenu(false);
  };

  const openMainMenu = () => {
    stateRef.current = makeInitialState();
    setScore(0);
    setLives(3);
    setLevel(1);
    setEnemyLeft(stateRef.current.enemies.length);
    setActivePowerUps("None");
    modeRef.current = "menu";
    keysRef.current.clear();
    setShowMenu(true);
    setStatus("Main Menu");
  };

  const spawnBullet = (owner, x, y, dir) => {
    const vec = DIR_VECTORS[dir];
    stateRef.current.bullets.push({
      id: `${owner}-${Math.random().toString(36).slice(2, 9)}`,
      owner,
      x,
      y,
      dir,
      vx: vec.x,
      vy: vec.y,
      speed: owner === "player" ? 330 : 250,
      size: 6,
    });
  };

  const spawnVectorBullet = (owner, x, y, vx, vy) => {
    const len = Math.hypot(vx, vy) || 1;
    stateRef.current.bullets.push({
      id: `${owner}-${Math.random().toString(36).slice(2, 9)}`,
      owner,
      x,
      y,
      dir: "up",
      vx: vx / len,
      vy: vy / len,
      speed: owner === "player" ? 330 : 250,
      size: 6,
    });
  };

  const spawnPowerUp = (x, y) => {
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    stateRef.current.powerUps.push({
      id: `pu-${Math.random().toString(36).slice(2, 9)}`,
      type,
      x,
      y,
      size: 16,
      ttl: 9,
    });
  };

  const validTankPosition = (tankRect) => {
    if (tankRect.x < 0 || tankRect.y < 0 || tankRect.x + tankRect.w > WORLD.width || tankRect.y + tankRect.h > WORLD.height) {
      return false;
    }

    for (const wall of stateRef.current.bricks) {
      if (hit(tankRect, wall)) return false;
    }

    return true;
  };

  const tick = (dt) => {
    const state = stateRef.current;
    if (!state.running || modeRef.current !== "play") return;

    const keys = keysRef.current;
    const p = state.player;

    p.shootCd = Math.max(0, p.shootCd - dt);
    p.invincible = Math.max(0, p.invincible - dt);
    state.effects.shield = Math.max(0, state.effects.shield - dt);
    state.effects.rapidfire = Math.max(0, state.effects.rapidfire - dt);
    state.effects.spread = Math.max(0, state.effects.spread - dt);

    let moveX = 0;
    let moveY = 0;

    if (keys.has("ArrowUp") || keys.has("KeyW")) {
      moveY -= 1;
      p.dir = "up";
    }
    if (keys.has("ArrowDown") || keys.has("KeyS")) {
      moveY += 1;
      p.dir = "down";
    }
    if (keys.has("ArrowLeft") || keys.has("KeyA")) {
      moveX -= 1;
      p.dir = "left";
    }
    if (keys.has("ArrowRight") || keys.has("KeyD")) {
      moveX += 1;
      p.dir = "right";
    }

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      const nx = moveX / len;
      const ny = moveY / len;
      const tryX = p.x + nx * p.speed * dt;
      const tryY = p.y + ny * p.speed * dt;

      const xRect = rectFromTank({ ...p, x: tryX, y: p.y });
      if (validTankPosition(xRect)) p.x = tryX;

      const yRect = rectFromTank({ ...p, x: p.x, y: tryY });
      if (validTankPosition(yRect)) p.y = tryY;
    }

    p.x = clamp(p.x, WORLD.tankSize / 2, WORLD.width - WORLD.tankSize / 2);
    p.y = clamp(p.y, WORLD.tankSize / 2, WORLD.height - WORLD.tankSize / 2);

    const activePlayerBullets = state.bullets.filter((b) => b.owner === "player").length;
    const hasFirePowerUp = state.effects.rapidfire > 0 || state.effects.spread > 0;
    const canShootByMode = hasFirePowerUp || activePlayerBullets < 2;
    if (keys.has("Space") && p.shootCd <= 0 && canShootByMode) {
      const vec = DIR_VECTORS[p.dir];
      const muzzle = WORLD.tankSize / 2 + 6;
      const originX = p.x + vec.x * muzzle;
      const originY = p.y + vec.y * muzzle;
      if (state.effects.spread > 0) {
        const spread = 0.36;
        const leftVx = vec.x * Math.cos(spread) - vec.y * Math.sin(spread);
        const leftVy = vec.x * Math.sin(spread) + vec.y * Math.cos(spread);
        const rightVx = vec.x * Math.cos(-spread) - vec.y * Math.sin(-spread);
        const rightVy = vec.x * Math.sin(-spread) + vec.y * Math.cos(-spread);
        spawnVectorBullet("player", originX, originY, vec.x, vec.y);
        spawnVectorBullet("player", originX, originY, leftVx, leftVy);
        spawnVectorBullet("player", originX, originY, rightVx, rightVy);
      } else {
        spawnBullet("player", originX, originY, p.dir);
      }
      p.shootCd = state.effects.rapidfire > 0 ? 0.12 : 0.35;
    }

    for (const e of state.enemies) {
      e.changeTimer -= dt;
      e.shootTimer -= dt;

      if (e.changeTimer <= 0) {
        e.dir = randomDir();
        e.changeTimer = 0.5 + Math.random() * 1.2;
      }

      const v = DIR_VECTORS[e.dir];
      const speed = e.speed * dt;
      const tryX = e.x + v.x * speed;
      const tryY = e.y + v.y * speed;
      const nextRect = rectFromTank({ ...e, x: tryX, y: tryY });

      if (validTankPosition(nextRect)) {
        e.x = tryX;
        e.y = tryY;
      } else {
        e.dir = randomDir();
      }

      if (e.shootTimer <= 0) {
        const muzzle = (e.size ?? WORLD.tankSize) / 2 + 6;
        spawnBullet("enemy", e.x + v.x * muzzle, e.y + v.y * muzzle, e.dir);
        e.shootTimer = e.isBoss ? 0.35 + Math.random() * 0.35 : 0.9 + Math.random() * 1.4;
      }
    }

    for (const b of state.bullets) {
      b.x += b.vx * b.speed * dt;
      b.y += b.vy * b.speed * dt;
    }

    state.bullets = state.bullets.filter((b) => {
      if (b.x < 0 || b.y < 0 || b.x > WORLD.width || b.y > WORLD.height) return false;

      const bulletRect = { x: b.x - b.size / 2, y: b.y - b.size / 2, w: b.size, h: b.size };
      for (const wall of state.bricks) {
        if (hit(bulletRect, wall)) return false;
      }

      return true;
    });

    const nextBullets = [];

    for (const b of state.bullets) {
      const bulletRect = { x: b.x - b.size / 2, y: b.y - b.size / 2, w: b.size, h: b.size };
      let consumed = false;

      if (b.owner === "player") {
        for (const e of state.enemies) {
          if (hit(bulletRect, rectFromTank(e))) {
            e.hp -= 1;
            consumed = true;
            state.score += e.score ?? 100;
            state.explosions.push({ x: e.x, y: e.y, t: 0.18 });
            if (e.hp <= 0 && e.canDropPowerUp) spawnPowerUp(e.x, e.y);
            break;
          }
        }
      }

      if (!consumed && b.owner === "enemy" && p.invincible <= 0) {
        if (hit(bulletRect, rectFromTank(p))) {
          consumed = true;
          if (state.effects.shield > 0) {
            state.effects.shield = 0;
            p.invincible = 0.3;
            state.explosions.push({ x: p.x, y: p.y, t: 0.18 });
          } else {
            state.lives -= 1;
            p.x = WORLD.width / 2;
            p.y = WORLD.height - 70;
            p.dir = "up";
            p.invincible = 1.2;
            state.explosions.push({ x: p.x, y: p.y, t: 0.24 });
          }
        }
      }

      if (!consumed) {
        nextBullets.push(b);
      }
    }

    state.bullets = nextBullets;
    const playerRect = rectFromTank(p);
    const keptPowerUps = [];
    for (const pu of state.powerUps) {
      pu.ttl -= dt;
      const puRect = { x: pu.x - pu.size / 2, y: pu.y - pu.size / 2, w: pu.size, h: pu.size };
      if (hit(playerRect, puRect)) {
        if (pu.type === "extraLife") {
          state.lives += 1;
        } else {
          const effect = POWERUP_STYLE[pu.type];
          state.effects[pu.type] += effect.duration;
        }
        continue;
      }
      if (pu.ttl > 0) keptPowerUps.push(pu);
    }
    state.powerUps = keptPowerUps;

    state.enemies = state.enemies.filter((e) => e.hp > 0);
    state.explosions = state.explosions
      .map((x) => ({ ...x, t: x.t - dt }))
      .filter((x) => x.t > 0);

    if (state.lives <= 0) {
      state.running = false;
      state.won = false;
      setStatus("Game Over");
    } else if (state.enemies.length === 0) {
      if (state.level >= state.maxLevel) {
        state.running = false;
        state.won = true;
        setStatus("Victory");
      } else {
        state.level += 1;
        state.enemies = buildEnemiesForLevel(state.level);
        state.bricks = getLevelBricks(state.level);
        state.bullets = [];
        state.powerUps = [];
        p.x = WORLD.width / 2;
        p.y = WORLD.height - 70;
        p.dir = "up";
        p.invincible = 1.1;
        const nextCfg = LEVELS[state.level - 1];
        setStatus(nextCfg?.boss ? `Level ${state.level}: Boss Fight` : `Level ${state.level}`);
      }
    }

    setScore(state.score);
    setLives(state.lives);
    setLevel(state.level);
    setEnemyLeft(state.enemies.length);
    const buffs = [];
    if (state.effects.shield > 0) buffs.push(`Shield ${Math.ceil(state.effects.shield)}s`);
    if (state.effects.rapidfire > 0) buffs.push(`Rapid ${Math.ceil(state.effects.rapidfire)}s`);
    if (state.effects.spread > 0) buffs.push(`Spread ${Math.ceil(state.effects.spread)}s`);
    setActivePowerUps(buffs.length ? buffs.join(" | ") : "None");
  };

  const drawTank = (ctx, tank, color, turret) => {
    const s = tank.size ?? WORLD.tankSize;
    const x = tank.x - s / 2;
    const y = tank.y - s / 2;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, s, s);

    ctx.fillStyle = "#091018";
    ctx.fillRect(x + 3, y + 3, 6, s - 6);
    ctx.fillRect(x + s - 9, y + 3, 6, s - 6);

    ctx.fillStyle = turret;
    ctx.beginPath();
    ctx.arc(tank.x, tank.y, 7, 0, Math.PI * 2);
    ctx.fill();

    const d = DIR_VECTORS[tank.dir];
    ctx.strokeStyle = turret;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tank.x, tank.y);
    ctx.lineTo(tank.x + d.x * 18, tank.y + d.y * 18);
    ctx.stroke();

    if (tank.isPlayerShielded) {
      ctx.strokeStyle = "rgba(101, 182, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tank.x, tank.y, s / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const state = stateRef.current;

    ctx.clearRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = "#13314f";
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    ctx.fillStyle = "#1e4a26";
    for (let i = 0; i < 70; i += 1) {
      const px = (i * 73) % WORLD.width;
      const py = (i * 131) % WORLD.height;
      ctx.fillRect(px, py, 3, 3);
    }

    ctx.fillStyle = "#8e6038";
    for (const w of state.bricks) {
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = "#51351e";
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    }

    drawTank(
      ctx,
      { ...state.player, isPlayerShielded: state.effects.shield > 0 },
      state.player.invincible > 0 ? "#7da9d8" : "#5fd36a",
      "#e6f3e8"
    );

    for (const e of state.enemies) {
      const enemyColor = e.canDropPowerUp ? "#d14f4f" : "#8f98a3";
      drawTank(ctx, e, enemyColor, e.isBoss ? "#ffd56b" : "#ffe1cd");
    }

    for (const b of state.bullets) {
      ctx.fillStyle = b.owner === "player" ? "#ffef9e" : "#ff9f89";
      ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
    }

    for (const pu of state.powerUps) {
      const style = POWERUP_STYLE[pu.type];
      ctx.fillStyle = style.color;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, pu.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#082030";
      ctx.font = "bold 12px Verdana";
      ctx.textAlign = "center";
      ctx.fillText(style.label, pu.x, pu.y + 4);
    }

    for (const ex of state.explosions) {
      const r = (1 - ex.t / 0.24) * 24;
      ctx.fillStyle = `rgba(255, 160, 80, ${Math.max(0.2, ex.t * 4)})`;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const activeHud = [];
    if (state.effects.shield > 0) activeHud.push({ name: "Shield", t: state.effects.shield, color: "#65b6ff" });
    if (state.effects.rapidfire > 0) activeHud.push({ name: "Rapid", t: state.effects.rapidfire, color: "#ff9f43" });
    if (state.effects.spread > 0) activeHud.push({ name: "Spread", t: state.effects.spread, color: "#a8ff60" });
    if (activeHud.length > 0) {
      ctx.textAlign = "left";
      ctx.font = "bold 14px Verdana";
      for (let i = 0; i < activeHud.length; i += 1) {
        const item = activeHud[i];
        const bx = 12;
        const by = 14 + i * 28;
        ctx.fillStyle = "rgba(6, 12, 20, 0.72)";
        ctx.fillRect(bx, by, 156, 22);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 0.5, by + 0.5, 155, 21);
        ctx.fillStyle = item.color;
        ctx.fillText(`${item.name}: ${Math.ceil(item.t)}s`, bx + 8, by + 16);
      }
    }

    if (!state.running) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);
      ctx.fillStyle = state.won ? "#f7e49c" : "#ff9f9f";
      ctx.font = "bold 48px Verdana";
      ctx.textAlign = "center";
      ctx.fillText(state.won ? "YOU WIN" : "GAME OVER", WORLD.width / 2, WORLD.height / 2);
    }
  };

  return (
    <main className={styles.wrap}>
      <div className={styles.topbar}>
        <h1 className={styles.title}>Battle Tank Classic</h1>
        <div className={styles.stats}>
          <span className={styles.pill}>Score: {score}</span>
          <span className={styles.pill}>Level: {level}</span>
          <span className={styles.pill}>Lives: {lives}</span>
          <span className={styles.pill}>Enemies: {enemyLeft}</span>
          <span className={`${styles.pill} ${isTerminalStatus ? styles.over : ""}`}>{status}</span>
        </div>
      </div>

      <div className={styles.canvasFrame}>
        <canvas ref={canvasRef} className={styles.canvas} width={WORLD.width} height={WORLD.height} />
        {showMenu && (
          <div className={styles.menuOverlay}>
            <h2 className={styles.menuTitle}>Main Menu</h2>
            <p className={styles.menuText}>Battle Tank Classic</p>
            <p className={styles.menuText}>10 levels, boss fight at level 3, and power-ups.</p>
            <button type="button" className={styles.button} onClick={resetGame}>
              Start Game
            </button>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        Move: WASD or Arrow Keys. Shoot: Space. Power Ups: Shield, Rapidfire, Spread Fire, Extra Life. Normal mode is capped at 2 bullets on-screen. Enemy colors: Red = can drop power-up, Gray = no drop.
      </div>

      <div className={styles.controls}>
        Active Power Ups: {activePowerUps}
      </div>

      <div className={styles.buttonRow}>
        <button type="button" className={styles.button} onClick={resetGame}>
          Restart Game
        </button>
        <button type="button" className={styles.button} onClick={openMainMenu}>
          Main Menu
        </button>
      </div>
    </main>
  );
}
