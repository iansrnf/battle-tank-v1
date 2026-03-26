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

export const LEVEL_BRICKS = [
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

export const LEVELS = [
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

export const POWERUP_TYPES = ["shield", "rapidfire", "spread", "extraLife"];

export const POWERUP_STYLE = {
  shield: { color: "#65b6ff", label: "S", duration: 20 },
  rapidfire: { color: "#ff9f43", label: "R", duration: 10 },
  spread: { color: "#a8ff60", label: "P", duration: 12 },
  extraLife: { color: "#ff5f8f", label: "+1", duration: 0 },
};
