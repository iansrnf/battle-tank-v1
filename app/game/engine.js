import { DIR_VECTORS, POWERUP_STYLE, POWERUP_TYPES, TOTAL_LEVELS, WORLD, getLevelBricks, getLevelConfig } from "./config";

const PLAYER_BASE_SPEED = 135;
const PLAYER_SPEED_STACK_BONUS = 18;
const PLAYER_MAX_SPEED_STACKS = 5;
const PLAYER_MAX_SHIELD_HP = 3;
const NORMAL_SHIELD_STAGE_TIMERS = {
  3: 10,
  2: 15,
  1: 20,
};
const ULTIMATE_SHIELD_INCREMENT = 60;
const ULTIMATE_SHIELD_MAX_TIME = 300;

function getShieldStageDuration(shieldHp) {
  return NORMAL_SHIELD_STAGE_TIMERS[shieldHp] ?? 0;
}

function hasUltimateShield(player) {
  return (player.ultimateShieldTime ?? 0) > 0;
}

function hasNormalShield(player) {
  return (player.shieldHp ?? 0) > 0 && !hasUltimateShield(player);
}

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

function getBossAimVector(enemy, player) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

export function buildEnemiesForLevel(level) {
  const cfg = getLevelConfig(level);
  if (!cfg) return [];

  if (cfg.boss) {
    const profile = cfg.bossProfile;
    return [
      {
        id: `boss-${level}`,
        x: WORLD.width / 2,
        y: 88,
        dir: "down",
        speed: profile.speed,
        changeTimer: 0.55,
        shootTimer: profile.shootMin,
        hp: profile.hp,
        maxHp: profile.hp,
        score: cfg.score,
        isBoss: true,
        canDropPowerUp: true,
        size: profile.size,
        bossTier: cfg.bossTier,
        bossProfile: profile,
        dashTimer: 2.4,
        armorTimer: 0,
        summonTimer: 4.8,
        burstCooldown: 0,
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

function createLevelBricks(level) {
  return getLevelBricks(level).map((brick) => ({ ...brick }));
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
    bricks: createLevelBricks(level),
    player: {
      x: WORLD.width / 2,
      y: WORLD.height - 70,
      dir: "up",
      speed: PLAYER_BASE_SPEED,
      shootCd: 0,
      invincible: 0,
      speedStacks: 0,
      shieldHp: 0,
      shieldTimer: 0,
      ultimateShieldTime: 0,
    },
    enemies: buildEnemiesForLevel(level),
    bullets: [],
    powerUps: [],
    effects: {
      rapidfire: 0,
      spread: 0,
    },
    explosions: [],
    restartTimer: null,
  };
}

export function startGameState() {
  return {
    ...makeInitialState(),
    mode: "play",
    status: "Level 1",
  };
}

export function summarizePowerUps(state) {
  const buffs = [];
  if (hasUltimateShield(state.player)) {
    buffs.push(`Ultimate Shield ${Math.ceil(state.player.ultimateShieldTime)}s`);
  } else if (hasNormalShield(state.player)) {
    buffs.push(`Shield ${Math.ceil(state.player.shieldTimer)}s`);
  }
  if (state.effects.rapidfire > 0) buffs.push(`Rapid ${Math.ceil(state.effects.rapidfire)}s`);
  if (state.effects.spread > 0) buffs.push(`Spread ${Math.ceil(state.effects.spread)}s`);
  return buffs.length ? buffs.join(" | ") : "None";
}

export function getHudSnapshot(state) {
  const boss = state.enemies.find((enemy) => enemy.isBoss);
  return {
    score: state.score,
    lives: state.lives,
    level: state.level,
    enemyLeft: state.enemies.length,
    activePowerUps: summarizePowerUps(state),
    status: state.status,
    showMenu: state.mode === "menu",
    isTerminalStatus: state.status === "Game Over" || state.status === "Victory",
    bossName: boss?.bossProfile?.name ?? null,
    bossHp: boss ? boss.hp : null,
    bossMaxHp: boss?.maxHp ?? null,
    restartTimer: state.restartTimer,
    speedStacks: state.player.speedStacks ?? 0,
    shieldHp: state.player.shieldHp ?? 0,
    shieldTimer: state.player.shieldTimer ?? 0,
    ultimateShieldTime: state.player.ultimateShieldTime ?? 0,
  };
}

function restartRun(state) {
  const nextState = startGameState();
  Object.assign(state, nextState);
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

function spawnAimedBullet(state, owner, x, y, targetX, targetY, speedMultiplier = 1) {
  const dx = targetX - x;
  const dy = targetY - y;
  const length = Math.hypot(dx, dy) || 1;
  state.bullets.push({
    id: createId(owner),
    owner,
    x,
    y,
    dir: "up",
    vx: dx / length,
    vy: dy / length,
    speed: (owner === "player" ? 330 : 250) * speedMultiplier,
    size: 6,
  });
}

function spawnRadialBurst(state, enemy, projectiles) {
  for (let index = 0; index < projectiles; index += 1) {
    const angle = (Math.PI * 2 * index) / projectiles;
    spawnVectorBullet(state, "enemy", enemy.x, enemy.y, Math.cos(angle), Math.sin(angle));
  }
}

function spawnBurstShot(state, enemy, targetVector) {
  const spread = 0.32;
  const center = targetVector ?? DIR_VECTORS[enemy.dir];
  const vectors = [
    center,
    {
      x: center.x * Math.cos(spread) - center.y * Math.sin(spread),
      y: center.x * Math.sin(spread) + center.y * Math.cos(spread),
    },
    {
      x: center.x * Math.cos(-spread) - center.y * Math.sin(-spread),
      y: center.x * Math.sin(-spread) + center.y * Math.cos(-spread),
    },
  ];

  for (const vector of vectors) {
    spawnVectorBullet(state, "enemy", enemy.x, enemy.y, vector.x, vector.y);
  }
}

function spawnBossMinion(state, boss) {
  const offset = Math.random() > 0.5 ? -64 : 64;
  state.enemies.push({
    id: createId(`minion-${boss.bossTier}`),
    x: clamp(boss.x + offset, 44, WORLD.width - 44),
    y: clamp(boss.y + 56, 52, WORLD.height / 2),
    dir: "down",
    speed: 120 + boss.bossTier * 4,
    changeTimer: 0.45,
    shootTimer: 1.3,
    hp: boss.bossProfile.summonHp,
    score: Math.max(100, Math.floor(boss.score * 0.2)),
    canDropPowerUp: false,
    size: 26,
  });
}

function updateBossBehavior(state, enemy, player, dt) {
  const profile = enemy.bossProfile;
  const aim = getBossAimVector(enemy, player);

  enemy.armorTimer = Math.max(0, enemy.armorTimer - dt);
  enemy.dashTimer -= dt;
  enemy.summonTimer -= dt;

  if (profile.abilities.includes("dash") && enemy.dashTimer <= 0) {
    enemy.dir = Math.abs(aim.x) > Math.abs(aim.y) ? (aim.x < 0 ? "left" : "right") : aim.y < 0 ? "up" : "down";
    const dashDistance = profile.dashSpeed * dt;
    const nextRect = rectFromTank({
      ...enemy,
      x: enemy.x + aim.x * dashDistance,
      y: enemy.y + aim.y * dashDistance,
    });
    if (validTankPosition(state.bricks, nextRect)) {
      enemy.x += aim.x * dashDistance;
      enemy.y += aim.y * dashDistance;
    }
    enemy.dashTimer = Math.max(1.1, 2.8 - enemy.bossTier * 0.08);
  }

  if (profile.abilities.includes("summon") && enemy.summonTimer <= 0) {
    const activeMinions = state.enemies.filter((candidate) => !candidate.isBoss).length;
    if (activeMinions < 4) {
      spawnBossMinion(state, enemy);
    }
    enemy.summonTimer = Math.max(2.8, 5 - enemy.bossTier * 0.08);
  }

  return aim;
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

function applyPermanentSpeedUpgrade(player) {
  const nextStacks = Math.min(PLAYER_MAX_SPEED_STACKS, (player.speedStacks ?? 0) + 1);
  player.speedStacks = nextStacks;
  player.speed = PLAYER_BASE_SPEED + nextStacks * PLAYER_SPEED_STACK_BONUS;
}

function grantShield(player) {
  if (hasUltimateShield(player)) {
    player.ultimateShieldTime = Math.min(ULTIMATE_SHIELD_MAX_TIME, player.ultimateShieldTime + ULTIMATE_SHIELD_INCREMENT);
    return;
  }

  if (hasNormalShield(player)) {
    player.ultimateShieldTime = ULTIMATE_SHIELD_INCREMENT;
    player.shieldHp = PLAYER_MAX_SHIELD_HP;
    player.shieldTimer = 0;
    return;
  }

  player.shieldHp = PLAYER_MAX_SHIELD_HP;
  player.shieldTimer = getShieldStageDuration(player.shieldHp);
  player.ultimateShieldTime = 0;
}

export function applyPowerUpToState(state, type) {
  const player = state.player;

  if (type === "extraLife") {
    state.lives += 1;
    return;
  }

  if (type === "shield") {
    grantShield(player);
    return;
  }

  if (type === "speed") {
    applyPermanentSpeedUpgrade(player);
    return;
  }

  if (type === "rapidfire" || type === "spread") {
    state.effects[type] += POWERUP_STYLE[type].duration;
  }
}

export function stepGame(state, keys, dt) {
  if (state.mode !== "play") return;

  if (!state.running) {
    if (!state.won && state.restartTimer != null) {
      state.restartTimer = Math.max(0, state.restartTimer - dt);
      if (state.restartTimer <= 0) {
        restartRun(state);
      }
    }
    return;
  }

  const player = state.player;
  player.shootCd = Math.max(0, player.shootCd - dt);
  player.invincible = Math.max(0, player.invincible - dt);
  state.effects.rapidfire = Math.max(0, state.effects.rapidfire - dt);
  state.effects.spread = Math.max(0, state.effects.spread - dt);

  if (hasUltimateShield(player)) {
    player.ultimateShieldTime = Math.max(0, player.ultimateShieldTime - dt);
    if (player.ultimateShieldTime <= 0) {
      player.ultimateShieldTime = 0;
      player.shieldHp = 1;
      player.shieldTimer = getShieldStageDuration(1);
    }
  } else if (hasNormalShield(player)) {
    player.shieldTimer = Math.max(0, player.shieldTimer - dt);
    if (player.shieldTimer <= 0) {
      if (player.shieldHp > 1) {
        player.shieldHp -= 1;
        player.shieldTimer = getShieldStageDuration(player.shieldHp);
      } else {
        player.shieldHp = 0;
        player.shieldTimer = 0;
      }
    }
  }

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

    if (enemy.isBoss) {
      updateBossBehavior(state, enemy, player, dt);
    }

    if (enemy.shootTimer <= 0) {
      const muzzle = (enemy.size ?? WORLD.tankSize) / 2 + 6;

      if (enemy.isBoss) {
        const aim = getBossAimVector(enemy, player);
        const originX = enemy.x + aim.x * muzzle;
        const originY = enemy.y + aim.y * muzzle;

        if (enemy.bossProfile.abilities.includes("radial")) {
          spawnRadialBurst(state, enemy, Math.min(12, 6 + enemy.bossTier));
        } else if (enemy.bossProfile.abilities.includes("burst")) {
          spawnBurstShot(state, enemy, aim);
        } else if (enemy.bossProfile.abilities.includes("aimed")) {
          spawnAimedBullet(state, "enemy", originX, originY, player.x, player.y, 1 + enemy.bossTier * 0.03);
        } else {
          spawnBullet(state, "enemy", enemy.x + vector.x * muzzle, enemy.y + vector.y * muzzle, enemy.dir);
        }

        enemy.shootTimer = enemy.bossProfile.shootMin + Math.random() * (enemy.bossProfile.shootMax - enemy.bossProfile.shootMin);
      } else {
        spawnBullet(state, "enemy", enemy.x + vector.x * muzzle, enemy.y + vector.y * muzzle, enemy.dir);
        enemy.shootTimer = 0.9 + Math.random() * 1.4;
      }
    }
  }

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * bullet.speed * dt;
    bullet.y += bullet.vy * bullet.speed * dt;
  }

  state.bullets = state.bullets.filter((bullet) => {
    return !(bullet.x < 0 || bullet.y < 0 || bullet.x > WORLD.width || bullet.y > WORLD.height);
  });

  const remainingBullets = [];
  for (const bullet of state.bullets) {
    const bulletRect = { x: bullet.x - bullet.size / 2, y: bullet.y - bullet.size / 2, w: bullet.size, h: bullet.size };
    let consumed = false;

    const wallIndex = state.bricks.findIndex((wall) => hit(bulletRect, wall));
    if (wallIndex >= 0) {
      consumed = true;
      const wall = state.bricks[wallIndex];
      if (wall.destructible) {
        state.bricks.splice(wallIndex, 1);
        state.explosions.push({ x: wall.x + wall.w / 2, y: wall.y + wall.h / 2, t: 0.1 });
      }
    }

    if (!consumed && bullet.owner === "player") {
      for (const enemy of state.enemies) {
        if (!hit(bulletRect, rectFromTank(enemy))) continue;

        const damage = enemy.isBoss && enemy.bossProfile?.abilities.includes("armor") && enemy.armorTimer > 0 ? 0.35 : 1;
        enemy.hp -= damage;
        consumed = true;
        state.score += enemy.score ?? 100;
        state.explosions.push({ x: enemy.x, y: enemy.y, t: 0.18 });
        if (enemy.isBoss && enemy.bossProfile?.abilities.includes("armor")) {
          enemy.armorTimer = enemy.bossProfile.armorCooldown;
        }
        if (enemy.hp <= 0 && enemy.canDropPowerUp) {
          spawnPowerUp(state, enemy.x, enemy.y);
        }
        break;
      }
    }

    if (!consumed && bullet.owner === "enemy" && player.invincible <= 0 && hit(bulletRect, rectFromTank(player))) {
      consumed = true;
      if (hasUltimateShield(player)) {
        player.invincible = 0.2;
      } else if (hasNormalShield(player)) {
        player.shieldHp -= 1;
        player.shieldTimer = player.shieldHp > 0 ? Math.max(player.shieldTimer, 1.5) : 0;
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
      applyPowerUpToState(state, powerUp.type);
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
    state.restartTimer = 3;
    return;
  }

  if (state.enemies.length > 0) return;

  if (state.level >= state.maxLevel) {
    state.running = false;
    state.won = true;
    state.status = "Victory";
    state.restartTimer = null;
    return;
  }

  state.level += 1;
  state.enemies = buildEnemiesForLevel(state.level);
  state.bricks = createLevelBricks(state.level);
  state.bullets = [];
  state.powerUps = [];
  state.restartTimer = null;
  resetPlayerPosition(player);
  player.invincible = 1.1;

  const nextLevel = getLevelConfig(state.level);
  state.status = nextLevel?.boss ? `Level ${state.level}: Boss Fight` : `Level ${state.level}`;
}
