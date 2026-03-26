import { DIR_VECTORS, POWERUP_STYLE, POWERUP_TYPES, TOTAL_LEVELS, WORLD, getLevelBricks, getLevelConfig } from "./config";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildEnemiesForLevel(level) {
  const cfg = getLevelConfig(level);
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
  for (let index = 0; index < cfg.count; index += 1) {
    enemies.push({
      id: `l${level}-e-${index}`,
      x: 60 + index * spacing,
      y: 72 + (index % 2) * 16,
      dir: "down",
      speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
      changeTimer: 0.4 + Math.random(),
      shootTimer: cfg.shootMin + Math.random() * (cfg.shootMax - cfg.shootMin),
      hp: cfg.hp,
      score: cfg.score,
      canDropPowerUp: dropIndexes.has(index),
    });
  }

  return enemies;
}

export function makeInitialState() {
  const level = 1;

  return {
    mode: "menu",
    running: true,
    won: false,
    status: "Main Menu",
    score: 0,
    lives: 3,
    level,
    maxLevel: TOTAL_LEVELS,
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

export function startGameState() {
  return {
    ...makeInitialState(),
    mode: "play",
    status: "Level 1",
  };
}

export function summarizePowerUps(effects) {
  const buffs = [];
  if (effects.shield > 0) buffs.push(`Shield ${Math.ceil(effects.shield)}s`);
  if (effects.rapidfire > 0) buffs.push(`Rapid ${Math.ceil(effects.rapidfire)}s`);
  if (effects.spread > 0) buffs.push(`Spread ${Math.ceil(effects.spread)}s`);
  return buffs.length ? buffs.join(" | ") : "None";
}

export function getHudSnapshot(state) {
  return {
    score: state.score,
    lives: state.lives,
    level: state.level,
    enemyLeft: state.enemies.length,
    activePowerUps: summarizePowerUps(state.effects),
    status: state.status,
    showMenu: state.mode === "menu",
    isTerminalStatus: state.status === "Game Over" || state.status === "Victory",
  };
}

function validTankPosition(bricks, tankRect) {
  if (tankRect.x < 0 || tankRect.y < 0 || tankRect.x + tankRect.w > WORLD.width || tankRect.y + tankRect.h > WORLD.height) {
    return false;
  }

  for (const wall of bricks) {
    if (hit(tankRect, wall)) return false;
  }

  return true;
}

function spawnBullet(state, owner, x, y, dir) {
  const vec = DIR_VECTORS[dir];
  state.bullets.push({
    id: createId(owner),
    owner,
    x,
    y,
    dir,
    vx: vec.x,
    vy: vec.y,
    speed: owner === "player" ? 330 : 250,
    size: 6,
  });
}

function spawnVectorBullet(state, owner, x, y, vx, vy) {
  const length = Math.hypot(vx, vy) || 1;
  state.bullets.push({
    id: createId(owner),
    owner,
    x,
    y,
    dir: "up",
    vx: vx / length,
    vy: vy / length,
    speed: owner === "player" ? 330 : 250,
    size: 6,
  });
}

function spawnPowerUp(state, x, y) {
  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  state.powerUps.push({
    id: createId("pu"),
    type,
    x,
    y,
    size: 16,
    ttl: 9,
  });
}

function resetPlayerPosition(player) {
  player.x = WORLD.width / 2;
  player.y = WORLD.height - 70;
  player.dir = "up";
}

export function stepGame(state, keys, dt) {
  if (!state.running || state.mode !== "play") return;

  const player = state.player;
  player.shootCd = Math.max(0, player.shootCd - dt);
  player.invincible = Math.max(0, player.invincible - dt);
  state.effects.shield = Math.max(0, state.effects.shield - dt);
  state.effects.rapidfire = Math.max(0, state.effects.rapidfire - dt);
  state.effects.spread = Math.max(0, state.effects.spread - dt);

  let moveX = 0;
  let moveY = 0;

  if (keys.has("ArrowUp") || keys.has("KeyW")) {
    moveY -= 1;
    player.dir = "up";
  }
  if (keys.has("ArrowDown") || keys.has("KeyS")) {
    moveY += 1;
    player.dir = "down";
  }
  if (keys.has("ArrowLeft") || keys.has("KeyA")) {
    moveX -= 1;
    player.dir = "left";
  }
  if (keys.has("ArrowRight") || keys.has("KeyD")) {
    moveX += 1;
    player.dir = "right";
  }

  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY);
    const nextX = player.x + (moveX / length) * player.speed * dt;
    const nextY = player.y + (moveY / length) * player.speed * dt;

    const xRect = rectFromTank({ ...player, x: nextX, y: player.y });
    if (validTankPosition(state.bricks, xRect)) player.x = nextX;

    const yRect = rectFromTank({ ...player, x: player.x, y: nextY });
    if (validTankPosition(state.bricks, yRect)) player.y = nextY;
  }

  player.x = clamp(player.x, WORLD.tankSize / 2, WORLD.width - WORLD.tankSize / 2);
  player.y = clamp(player.y, WORLD.tankSize / 2, WORLD.height - WORLD.tankSize / 2);

  const activePlayerBullets = state.bullets.filter((bullet) => bullet.owner === "player").length;
  const hasFirePowerUp = state.effects.rapidfire > 0 || state.effects.spread > 0;
  const canShootByMode = hasFirePowerUp || activePlayerBullets < 2;
  if (keys.has("Space") && player.shootCd <= 0 && canShootByMode) {
    const vec = DIR_VECTORS[player.dir];
    const muzzle = WORLD.tankSize / 2 + 6;
    const originX = player.x + vec.x * muzzle;
    const originY = player.y + vec.y * muzzle;

    if (state.effects.spread > 0) {
      const spread = 0.36;
      const leftVx = vec.x * Math.cos(spread) - vec.y * Math.sin(spread);
      const leftVy = vec.x * Math.sin(spread) + vec.y * Math.cos(spread);
      const rightVx = vec.x * Math.cos(-spread) - vec.y * Math.sin(-spread);
      const rightVy = vec.x * Math.sin(-spread) + vec.y * Math.cos(-spread);

      spawnVectorBullet(state, "player", originX, originY, vec.x, vec.y);
      spawnVectorBullet(state, "player", originX, originY, leftVx, leftVy);
      spawnVectorBullet(state, "player", originX, originY, rightVx, rightVy);
    } else {
      spawnBullet(state, "player", originX, originY, player.dir);
    }

    player.shootCd = state.effects.rapidfire > 0 ? 0.12 : 0.35;
  }

  for (const enemy of state.enemies) {
    enemy.changeTimer -= dt;
    enemy.shootTimer -= dt;

    if (enemy.changeTimer <= 0) {
      enemy.dir = randomDir();
      enemy.changeTimer = 0.5 + Math.random() * 1.2;
    }

    const vector = DIR_VECTORS[enemy.dir];
    const speed = enemy.speed * dt;
    const nextRect = rectFromTank({
      ...enemy,
      x: enemy.x + vector.x * speed,
      y: enemy.y + vector.y * speed,
    });

    if (validTankPosition(state.bricks, nextRect)) {
      enemy.x += vector.x * speed;
      enemy.y += vector.y * speed;
    } else {
      enemy.dir = randomDir();
    }

    if (enemy.shootTimer <= 0) {
      const muzzle = (enemy.size ?? WORLD.tankSize) / 2 + 6;
      spawnBullet(state, "enemy", enemy.x + vector.x * muzzle, enemy.y + vector.y * muzzle, enemy.dir);
      enemy.shootTimer = enemy.isBoss ? 0.35 + Math.random() * 0.35 : 0.9 + Math.random() * 1.4;
    }
  }

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * bullet.speed * dt;
    bullet.y += bullet.vy * bullet.speed * dt;
  }

  state.bullets = state.bullets.filter((bullet) => {
    if (bullet.x < 0 || bullet.y < 0 || bullet.x > WORLD.width || bullet.y > WORLD.height) {
      return false;
    }

    const bulletRect = { x: bullet.x - bullet.size / 2, y: bullet.y - bullet.size / 2, w: bullet.size, h: bullet.size };
    return !state.bricks.some((wall) => hit(bulletRect, wall));
  });

  const remainingBullets = [];
  for (const bullet of state.bullets) {
    const bulletRect = { x: bullet.x - bullet.size / 2, y: bullet.y - bullet.size / 2, w: bullet.size, h: bullet.size };
    let consumed = false;

    if (bullet.owner === "player") {
      for (const enemy of state.enemies) {
        if (!hit(bulletRect, rectFromTank(enemy))) continue;

        enemy.hp -= 1;
        consumed = true;
        state.score += enemy.score ?? 100;
        state.explosions.push({ x: enemy.x, y: enemy.y, t: 0.18 });
        if (enemy.hp <= 0 && enemy.canDropPowerUp) {
          spawnPowerUp(state, enemy.x, enemy.y);
        }
        break;
      }
    }

    if (!consumed && bullet.owner === "enemy" && player.invincible <= 0 && hit(bulletRect, rectFromTank(player))) {
      consumed = true;
      if (state.effects.shield > 0) {
        state.effects.shield = 0;
        player.invincible = 0.3;
      } else {
        state.lives -= 1;
        resetPlayerPosition(player);
        player.invincible = 1.2;
      }
      state.explosions.push({ x: player.x, y: player.y, t: 0.24 });
    }

    if (!consumed) {
      remainingBullets.push(bullet);
    }
  }
  state.bullets = remainingBullets;

  const playerRect = rectFromTank(player);
  const remainingPowerUps = [];
  for (const powerUp of state.powerUps) {
    powerUp.ttl -= dt;
    const powerUpRect = {
      x: powerUp.x - powerUp.size / 2,
      y: powerUp.y - powerUp.size / 2,
      w: powerUp.size,
      h: powerUp.size,
    };

    if (hit(playerRect, powerUpRect)) {
      if (powerUp.type === "extraLife") {
        state.lives += 1;
      } else {
        state.effects[powerUp.type] += POWERUP_STYLE[powerUp.type].duration;
      }
      continue;
    }

    if (powerUp.ttl > 0) remainingPowerUps.push(powerUp);
  }
  state.powerUps = remainingPowerUps;

  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  state.explosions = state.explosions
    .map((explosion) => ({ ...explosion, t: explosion.t - dt }))
    .filter((explosion) => explosion.t > 0);

  if (state.lives <= 0) {
    state.running = false;
    state.won = false;
    state.status = "Game Over";
    return;
  }

  if (state.enemies.length > 0) return;

  if (state.level >= state.maxLevel) {
    state.running = false;
    state.won = true;
    state.status = "Victory";
    return;
  }

  state.level += 1;
  state.enemies = buildEnemiesForLevel(state.level);
  state.bricks = getLevelBricks(state.level);
  state.bullets = [];
  state.powerUps = [];
  resetPlayerPosition(player);
  player.invincible = 1.1;

  const nextLevel = getLevelConfig(state.level);
  state.status = nextLevel?.boss ? `Level ${state.level}: Boss Fight` : `Level ${state.level}`;
}
