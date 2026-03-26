import { DIR_VECTORS, POWERUP_STYLE, WORLD } from "./config";

function drawTank(ctx, tank, color, turret) {
  const size = tank.size ?? WORLD.tankSize;
  const x = tank.x - size / 2;
  const y = tank.y - size / 2;

  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = "#091018";
  ctx.fillRect(x + 3, y + 3, 6, size - 6);
  ctx.fillRect(x + size - 9, y + 3, 6, size - 6);

  ctx.fillStyle = turret;
  ctx.beginPath();
  ctx.arc(tank.x, tank.y, 7, 0, Math.PI * 2);
  ctx.fill();

  const direction = DIR_VECTORS[tank.dir];
  ctx.strokeStyle = turret;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tank.x, tank.y);
  ctx.lineTo(tank.x + direction.x * 18, tank.y + direction.y * 18);
  ctx.stroke();

  if (!tank.isPlayerShielded) return;

  ctx.strokeStyle = "rgba(101, 182, 255, 0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(tank.x, tank.y, size / 2 + 5, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "#13314f";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.fillStyle = "#1e4a26";
  for (let index = 0; index < 70; index += 1) {
    const px = (index * 73) % WORLD.width;
    const py = (index * 131) % WORLD.height;
    ctx.fillRect(px, py, 3, 3);
  }

  ctx.fillStyle = "#8e6038";
  for (const wall of state.bricks) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = "#51351e";
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }

  drawTank(
    ctx,
    { ...state.player, isPlayerShielded: state.effects.shield > 0 },
    state.player.invincible > 0 ? "#7da9d8" : "#5fd36a",
    "#e6f3e8"
  );

  for (const enemy of state.enemies) {
    const enemyColor = enemy.canDropPowerUp ? "#d14f4f" : "#8f98a3";
    drawTank(ctx, enemy, enemyColor, enemy.isBoss ? "#ffd56b" : "#ffe1cd");
  }

  for (const bullet of state.bullets) {
    ctx.fillStyle = bullet.owner === "player" ? "#ffef9e" : "#ff9f89";
    ctx.fillRect(bullet.x - bullet.size / 2, bullet.y - bullet.size / 2, bullet.size, bullet.size);
  }

  for (const powerUp of state.powerUps) {
    const style = POWERUP_STYLE[powerUp.type];
    ctx.fillStyle = style.color;
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#082030";
    ctx.font = "bold 12px Verdana";
    ctx.textAlign = "center";
    ctx.fillText(style.label, powerUp.x, powerUp.y + 4);
  }

  for (const explosion of state.explosions) {
    const radius = (1 - explosion.t / 0.24) * 24;
    ctx.fillStyle = `rgba(255, 160, 80, ${Math.max(0.2, explosion.t * 4)})`;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const activeHud = [];
  if (state.effects.shield > 0) activeHud.push({ name: "Shield", t: state.effects.shield, color: "#65b6ff" });
  if (state.effects.rapidfire > 0) activeHud.push({ name: "Rapid", t: state.effects.rapidfire, color: "#ff9f43" });
  if (state.effects.spread > 0) activeHud.push({ name: "Spread", t: state.effects.spread, color: "#a8ff60" });
  if (activeHud.length > 0) {
    ctx.textAlign = "left";
    ctx.font = "bold 14px Verdana";
    for (let index = 0; index < activeHud.length; index += 1) {
      const item = activeHud[index];
      const boxX = 12;
      const boxY = 14 + index * 28;
      ctx.fillStyle = "rgba(6, 12, 20, 0.72)";
      ctx.fillRect(boxX, boxY, 156, 22);
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX + 0.5, boxY + 0.5, 155, 21);
      ctx.fillStyle = item.color;
      ctx.fillText(`${item.name}: ${Math.ceil(item.t)}s`, boxX + 8, boxY + 16);
    }
  }

  if (state.running) return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = state.won ? "#f7e49c" : "#ff9f9f";
  ctx.font = "bold 48px Verdana";
  ctx.textAlign = "center";
  ctx.fillText(state.won ? "YOU WIN" : "GAME OVER", WORLD.width / 2, WORLD.height / 2);
}
