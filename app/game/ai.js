import { WORLD } from "./config";

const AI_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"];
const ALIGNMENT_MARGIN = 18;

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
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
  if (state.powerUps.length > 0) {
    return state.powerUps.reduce((closest, powerUp) => {
      const distance = Math.hypot(powerUp.x - state.player.x, powerUp.y - state.player.y);
      if (!closest || distance < closest.distance) {
        return { type: "powerUp", entity: powerUp, distance };
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

  if (dodgeIncomingBullets(state, keys)) {
    return keys;
  }

  const target = chooseTarget(state);
  if (!target) return keys;

  const deltaX = target.entity.x - state.player.x;
  const deltaY = target.entity.y - state.player.y;
  addMoveKeys(keys, deltaX, deltaY);

  const fireDirection = getAlignedDirection(state.player, target.entity);
  if (!fireDirection || target.type !== "enemy") {
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

  return keys;
}

export function isAiKey(code) {
  return AI_KEYS.includes(code);
}
