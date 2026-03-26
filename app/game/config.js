export const WORLD = {
  width: 832,
  height: 640,
  tankSize: 28,
};

export const DIR_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const TOTAL_LEVELS = 100;
export const BOSS_INTERVAL = 5;
const DESTRUCTIBLE_BRICK_SIZE = 16;

const BOSS_ARCHETYPES = [
  {
    key: "fortress",
    name: "Fortress",
    color: "#ffd56b",
    accent: "#ff8c42",
    abilities: ["burst", "armor"],
  },
  {
    key: "hunter",
    name: "Hunter",
    color: "#7ee0ff",
    accent: "#1fb0ff",
    abilities: ["dash", "aimed"],
  },
  {
    key: "warlord",
    name: "Warlord",
    color: "#ff8aa8",
    accent: "#ff4f7a",
    abilities: ["summon", "burst"],
  },
  {
    key: "storm",
    name: "Storm Core",
    color: "#c59bff",
    accent: "#7f6cff",
    abilities: ["radial", "aimed"],
  },
];

export const POWERUP_TYPES = ["shield", "rapidfire", "spread", "extraLife", "speed"];

export const POWERUP_STYLE = {
  shield: { color: "#65b6ff", label: "S", duration: 20 },
  rapidfire: { color: "#ff9f43", label: "R", duration: 10 },
  spread: { color: "#a8ff60", label: "P", duration: 12 },
  extraLife: { color: "#ff5f8f", label: "+1", duration: 0 },
  speed: { color: "#ffe066", label: "SPD", duration: 0 },
};

const levelConfigCache = new Map();
const levelBricksCache = new Map();

function makeSeededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function isBossLevel(level) {
  return level % BOSS_INTERVAL === 0;
}

function getBossTier(level) {
  return Math.max(1, Math.floor(level / BOSS_INTERVAL));
}

function getBossArchetype(level) {
  return BOSS_ARCHETYPES[(getBossTier(level) - 1) % BOSS_ARCHETYPES.length];
}

function makeLevelConfig(level) {
  if (isBossLevel(level)) {
    const bossTier = getBossTier(level);
    const archetype = getBossArchetype(level);
    return {
      label: `Level ${level} Boss`,
      boss: true,
      bossTier,
      bossProfile: {
        ...archetype,
        hp: 10 + bossTier * 5,
        speed: Math.min(110 + bossTier * 8, 220),
        size: Math.min(42 + bossTier, 58),
        score: 900 + bossTier * 225,
        shootMin: Math.max(0.22, 0.62 - bossTier * 0.02),
        shootMax: Math.max(0.42, 0.95 - bossTier * 0.015),
        armorCooldown: Math.max(0.18, 0.45 - bossTier * 0.015),
        dashSpeed: Math.min(220 + bossTier * 10, 340),
        summonHp: clamp(1 + Math.floor(bossTier / 4), 1, 4),
      },
      score: 900 + bossTier * 225,
    };
  }

  const completedBosses = Math.floor((level - 1) / BOSS_INTERVAL);
  const regularIndex = level - completedBosses - 1;

  return {
    label: `Level ${level}`,
    count: clamp(6 + Math.floor(regularIndex * 0.75), 6, 24),
    hp: clamp(1 + Math.floor(regularIndex / 12), 1, 6),
    speedMin: Math.min(95 + regularIndex * 7, 320),
    speedMax: Math.min(130 + regularIndex * 7.5, 360),
    shootMin: Math.max(0.22, 0.8 - regularIndex * 0.012),
    shootMax: Math.max(0.55, 2.3 - regularIndex * 0.02),
    score: 100 + regularIndex * 18,
  };
}

function makeBossArena(level) {
  const rand = makeSeededRandom(level * 97);
  const arena = [
    { x: 224, y: 160, w: 128, h: 32, destructible: false },
    { x: 480, y: 160, w: 128, h: 32, destructible: false },
    { x: 288, y: 272, w: 256, h: 32, destructible: true },
    { x: 160, y: 416, w: 160, h: 32, destructible: true },
    { x: 512, y: 416, w: 160, h: 32, destructible: true },
  ];

  if (rand() > 0.5) {
    arena.push({ x: 384, y: 96, w: 64, h: 32, destructible: true });
  }

  return arena;
}

function overlaps(rect, walls, gap = 20) {
  return walls.some((wall) => {
    return !(
      rect.x + rect.w + gap <= wall.x ||
      wall.x + wall.w + gap <= rect.x ||
      rect.y + rect.h + gap <= wall.y ||
      wall.y + wall.h + gap <= rect.y
    );
  });
}

function makeRegularArena(level) {
  const rand = makeSeededRandom(level * 7919);
  const walls = [];
  const leftLimit = 64;
  const rightLimit = WORLD.width - 64;
  const topLimit = 96;
  const bottomLimit = WORLD.height - 96;
  const pairCount = 3 + Math.floor(rand() * 4) + Math.floor(level / 20);
  const midlineChance = 0.35 + Math.min(0.25, level * 0.003);
  const leftCenterMax = WORLD.width / 2 - 88;
  const spawnSafeZones = [
    { x: WORLD.width / 2 - 92, y: WORLD.height - 140, w: 184, h: 120 },
    { x: 40, y: 24, w: WORLD.width - 80, h: 120 },
  ];

  let attempts = 0;
  const maxAttempts = 120;
  while (walls.length < pairCount * 2 && attempts < maxAttempts) {
    attempts += 1;
    const width = rand() > 0.55 ? 96 : 128;
    const height = rand() > 0.7 ? 64 : 32;
    const destructible = rand() > 0.48;
    const x = Math.round((leftLimit + rand() * (leftCenterMax - leftLimit - width)) / 32) * 32;
    const y = Math.round((topLimit + rand() * (bottomLimit - topLimit - height)) / 32) * 32;
    const leftWall = { x, y, w: width, h: height, destructible };
    const rightWall = { x: WORLD.width - x - width, y, w: width, h: height, destructible };

    if (spawnSafeZones.some((zone) => overlaps(leftWall, [zone], 0) || overlaps(rightWall, [zone], 0))) {
      continue;
    }

    if (overlaps(leftWall, walls) || overlaps(rightWall, walls)) {
      continue;
    }

    walls.push(leftWall, rightWall);
  }

  if (rand() < midlineChance) {
    const centerWall = {
      x: WORLD.width / 2 - 64,
      y: 192 + Math.round(rand() * 7) * 32,
      w: 128,
      h: rand() > 0.5 ? 32 : 64,
      destructible: rand() > 0.35,
    };

    if (!spawnSafeZones.some((zone) => overlaps(centerWall, [zone], 0)) && !overlaps(centerWall, walls)) {
      walls.push(centerWall);
    }
  }

  return walls.sort((a, b) => a.y - b.y || a.x - b.x);
}

function expandWallSegments(walls) {
  const segments = [];

  for (const wall of walls) {
    if (!wall.destructible) {
      segments.push({
        ...wall,
        destructible: false,
      });
      continue;
    }

    for (let offsetY = 0; offsetY < wall.h; offsetY += DESTRUCTIBLE_BRICK_SIZE) {
      for (let offsetX = 0; offsetX < wall.w; offsetX += DESTRUCTIBLE_BRICK_SIZE) {
        segments.push({
          x: wall.x + offsetX,
          y: wall.y + offsetY,
          w: DESTRUCTIBLE_BRICK_SIZE,
          h: DESTRUCTIBLE_BRICK_SIZE,
          destructible: true,
        });
      }
    }
  }

  return segments.sort((a, b) => a.y - b.y || a.x - b.x);
}

export function getLevelConfig(level) {
  const normalizedLevel = Math.max(1, Math.min(level, TOTAL_LEVELS));
  if (!levelConfigCache.has(normalizedLevel)) {
    levelConfigCache.set(normalizedLevel, makeLevelConfig(normalizedLevel));
  }
  return levelConfigCache.get(normalizedLevel);
}

export function getLevelBricks(level) {
  const normalizedLevel = Math.max(1, Math.min(level, TOTAL_LEVELS));
  if (!levelBricksCache.has(normalizedLevel)) {
    levelBricksCache.set(
      normalizedLevel,
      expandWallSegments(isBossLevel(normalizedLevel) ? makeBossArena(normalizedLevel) : makeRegularArena(normalizedLevel))
    );
  }
  return levelBricksCache.get(normalizedLevel);
}
