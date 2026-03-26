import { WORLD } from "./config";

const AI_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"];
const ALIGNMENT_MARGIN = 18;
const STUCK_DISTANCE = 6;
const STUCK_FRAME_LIMIT = 14;

const AI_MEMORY = {
  lastX: null,
  lastY: null,
  stuckFrames: 0,
  escapeDir: null,
  escapeFrames: 0,
};

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function wouldCollide(state, x, y) {
  const half = WORLD.tankSize / 2;
  const rect = {
    x: x - half,
    y: y - half,
    w: WORLD.tankSize,
    h: WORLD.tankSize,
  };

  if (rect.x < 0 || rect.y < 0 || rect.x + rect.w > WORLD.width || rect.y + rect.h > WORLD.height) {
    return true;
  }

  return state.bricks.some((wall) => rectsOverlap(rect, wall));
}

function makeRayRect(player, direction, target) {
  const half = WORLD.tankSize / 2;

  switch (direction) {
    case "up":
      return {
        x: player.x - 8,
        y: target.y,
        w: 16,
        h: player.y - half - target.y,
      };
    case "down":
      return {
        x: player.x - 8,
        y: player.y + half,
        w: 16,
        h: target.y - (player.y + half),
      };
    case "left":
      return {
        x: target.x,
        y: player.y - 8,
        w: player.x - half - target.x,
        h: 16,
      };
    case "right":
      return {
        x: player.x + half,
        y: player.y - 8,
        w: target.x - (player.x + half),
        h: 16,
      };
    default:
      return null;
  }
}

function hasObstacleInRay(state, player, direction, target) {
  const ray = makeRayRect(player, direction, target);
  if (!ray || ray.w <= 0 || ray.h <= 0) return true;

  return state.bricks.some((wall) => rectsOverlap(ray, wall));
}

function chooseTarget(state) {
  const hasUltimateShield = (state.player.ultimateShieldTime ?? 0) > 0;

  if (state.powerUps.length > 0) {
    return state.powerUps.reduce((closest, powerUp) => {
      const distance = Math.hypot(powerUp.x - state.player.x, powerUp.y - state.player.y);
      if (!closest || distance < closest.distance) {
        return { type: "powerUp", entity: powerUp, distance };
      }
      return closest;
    }, null);
  }

  if (hasUltimateShield && state.enemies.length > 0) {
    return state.enemies.reduce((closest, enemy) => {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
      if (!closest || distance < closest.distance) {
        return { type: "enemy", entity: enemy, distance };
      }
      return closest;
    }, null);
  }

  if (state.enemies.length > 0) {
    return state.enemies.reduce((closest, enemy) => {
      const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
      if (!closest || distance < closest.distance) {
        return { type: "enemy", entity: enemy, distance };
      }
      return closest;
    }, null);
  }

  return null;
}

function getAlignedDirection(player, target) {
  const deltaX = target.x - player.x;
  const deltaY = target.y - player.y;

  if (Math.abs(deltaX) <= ALIGNMENT_MARGIN) {
    return deltaY < 0 ? "up" : "down";
  }

  if (Math.abs(deltaY) <= ALIGNMENT_MARGIN) {
    return deltaX < 0 ? "left" : "right";
  }

  return null;
}

function addMoveKeys(keys, deltaX, deltaY) {
  if (Math.abs(deltaX) > ALIGNMENT_MARGIN) {
    keys.add(deltaX < 0 ? "ArrowLeft" : "ArrowRight");
  }

  if (Math.abs(deltaY) > ALIGNMENT_MARGIN) {
    keys.add(deltaY < 0 ? "ArrowUp" : "ArrowDown");
  }
}

function addDirectionalKey(keys, dir) {
  if (dir === "up") keys.add("ArrowUp");
  if (dir === "down") keys.add("ArrowDown");
  if (dir === "left") keys.add("ArrowLeft");
  if (dir === "right") keys.add("ArrowRight");
}

function getMoveCandidates(deltaX, deltaY) {
  const horizontal = deltaX < 0 ? "left" : "right";
  const vertical = deltaY < 0 ? "up" : "down";
  const horizontalAlt = horizontal === "left" ? "right" : "left";
  const verticalAlt = vertical === "up" ? "down" : "up";

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return [horizontal, vertical, verticalAlt, horizontalAlt];
  }

  return [vertical, horizontal, horizontalAlt, verticalAlt];
}

function chooseOpenDirection(state, preferredDirs) {
  const probe = 20;

  for (const dir of preferredDirs) {
    const nextX = dir === "left" ? state.player.x - probe : dir === "right" ? state.player.x + probe : state.player.x;
    const nextY = dir === "up" ? state.player.y - probe : dir === "down" ? state.player.y + probe : state.player.y;
    if (!wouldCollide(state, nextX, nextY)) {
      return dir;
    }
  }

  return null;
}

function addSmartMoveKeys(state, keys, deltaX, deltaY) {
  const preferred = getMoveCandidates(deltaX, deltaY);
  const chosenDir = chooseOpenDirection(state, preferred);
  if (!chosenDir) return false;
  addDirectionalKey(keys, chosenDir);

  const secondaryDir = preferred.find((dir) => dir !== chosenDir && Math.abs(dir === "left" || dir === "right" ? deltaX : deltaY) > ALIGNMENT_MARGIN);
  if (secondaryDir) {
    const nextX = chosenDir === "left" ? state.player.x - 18 : chosenDir === "right" ? state.player.x + 18 : state.player.x;
    const nextY = chosenDir === "up" ? state.player.y - 18 : chosenDir === "down" ? state.player.y + 18 : state.player.y;
    const secondaryX = secondaryDir === "left" ? nextX - 18 : secondaryDir === "right" ? nextX + 18 : nextX;
    const secondaryY = secondaryDir === "up" ? nextY - 18 : secondaryDir === "down" ? nextY + 18 : nextY;
    if (!wouldCollide(state, secondaryX, secondaryY)) {
      addDirectionalKey(keys, secondaryDir);
    }
  }

  return true;
}

function updateStuckMemory(state, hasMovementIntent) {
  if (AI_MEMORY.lastX == null || AI_MEMORY.lastY == null) {
    AI_MEMORY.lastX = state.player.x;
    AI_MEMORY.lastY = state.player.y;
    return;
  }

  const distanceMoved = Math.hypot(state.player.x - AI_MEMORY.lastX, state.player.y - AI_MEMORY.lastY);
  if (hasMovementIntent && distanceMoved < STUCK_DISTANCE) {
    AI_MEMORY.stuckFrames += 1;
  } else {
    AI_MEMORY.stuckFrames = 0;
    if (distanceMoved >= STUCK_DISTANCE) {
      AI_MEMORY.escapeDir = null;
      AI_MEMORY.escapeFrames = 0;
    }
  }

  AI_MEMORY.lastX = state.player.x;
  AI_MEMORY.lastY = state.player.y;
}

function tryEscape(state, keys) {
  if (AI_MEMORY.escapeFrames > 0 && AI_MEMORY.escapeDir) {
    AI_MEMORY.escapeFrames -= 1;
    addDirectionalKey(keys, AI_MEMORY.escapeDir);
    return true;
  }

  if (AI_MEMORY.stuckFrames < STUCK_FRAME_LIMIT) return false;

  const dirs = ["up", "right", "down", "left"];
  const openDir = chooseOpenDirection(
    state,
    dirs.sort(() => Math.random() - 0.5)
  );
  if (!openDir) return false;

  AI_MEMORY.escapeDir = openDir;
  AI_MEMORY.escapeFrames = 12;
  AI_MEMORY.stuckFrames = 0;
  addDirectionalKey(keys, openDir);
  return true;
}

function dodgeIncomingBullets(state, keys) {
  const threat = state.bullets.find((bullet) => {
    if (bullet.owner !== "enemy") return false;

    const dx = Math.abs(bullet.x - state.player.x);
    const dy = Math.abs(bullet.y - state.player.y);
    const movingTowardPlayerX = Math.sign(state.player.x - bullet.x) === Math.sign(bullet.vx || 0);
    const movingTowardPlayerY = Math.sign(state.player.y - bullet.y) === Math.sign(bullet.vy || 0);

    return (dx < 24 && movingTowardPlayerY && dy < 180) || (dy < 24 && movingTowardPlayerX && dx < 180);
  });

  if (!threat) return false;

  if (Math.abs(threat.x - state.player.x) < 24) {
    keys.add(threat.x < state.player.x ? "ArrowRight" : "ArrowLeft");
    return true;
  }

  keys.add(threat.y < state.player.y ? "ArrowDown" : "ArrowUp");
  return true;
}

export function getAiKeys(state) {
  const keys = new Set();
  if (!state.running || state.mode !== "play") return keys;

  const target = chooseTarget(state);
  if (target?.type === "powerUp") {
    const deltaX = target.entity.x - state.player.x;
    const deltaY = target.entity.y - state.player.y;
    addSmartMoveKeys(state, keys, deltaX, deltaY);

    const fireDirection = getAlignedDirection(state.player, target.entity);
    if (fireDirection && state.enemies.length > 0) {
      keys.add(
        fireDirection === "up"
          ? "ArrowUp"
          : fireDirection === "down"
            ? "ArrowDown"
            : fireDirection === "left"
              ? "ArrowLeft"
              : "ArrowRight"
      );
    }
    updateStuckMemory(state, keys.size > 0);
    if (tryEscape(state, keys)) return keys;
    return keys;
  }

  const hasUltimateShield = (state.player.ultimateShieldTime ?? 0) > 0;
  if (!hasUltimateShield && dodgeIncomingBullets(state, keys)) {
    updateStuckMemory(state, true);
    if (tryEscape(state, keys)) return keys;
    return keys;
  }

  if (!target) return keys;

  const deltaX = target.entity.x - state.player.x;
  const deltaY = target.entity.y - state.player.y;
  const distanceToTarget = Math.hypot(deltaX, deltaY);

  if (target.type === "enemy" && distanceToTarget < 72) {
    const strafeDeltaX = Math.abs(deltaX) > Math.abs(deltaY) ? 0 : deltaY > 0 ? -48 : 48;
    const strafeDeltaY = Math.abs(deltaX) > Math.abs(deltaY) ? (deltaX > 0 ? 48 : -48) : 0;
    addSmartMoveKeys(state, keys, strafeDeltaX, strafeDeltaY);
  } else {
    addSmartMoveKeys(state, keys, deltaX, deltaY);
  }

  const fireDirection = getAlignedDirection(state.player, target.entity);
  if (!fireDirection || target.type !== "enemy") {
    updateStuckMemory(state, keys.size > 0);
    if (tryEscape(state, keys)) return keys;
    return keys;
  }

  if (
    !hasObstacleInRay(state, state.player, fireDirection, target.entity) &&
    state.bullets.filter((bullet) => bullet.owner === "player").length < 2
  ) {
    keys.clear();
    keys.add(
      fireDirection === "up"
        ? "ArrowUp"
        : fireDirection === "down"
          ? "ArrowDown"
          : fireDirection === "left"
            ? "ArrowLeft"
            : "ArrowRight"
    );
    keys.add("Space");
  }

  updateStuckMemory(state, keys.size > 0);
  if (tryEscape(state, keys)) return keys;

  return keys;
}

export function isAiKey(code) {
  return AI_KEYS.includes(code);
}
