import { DIR_VECTORS, POWERUP_STYLE, WORLD } from "./config";

function drawTank(ctx, tank, color, turret, alpha = 1) {
  const size = tank.size ?? WORLD.tankSize;
  const x = tank.x - size / 2;
  const y = tank.y - size / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

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

  if (!tank.isPlayerShielded) {
    ctx.restore();
    return;
  }

  const shieldHp = tank.shieldHp ?? 0;
  const shieldRadius = size / 2 + 5;
  const shieldPulse = (Math.sin(Date.now() / 180) + 1) / 2;

  if (tank.isUltimateShielded) {
    ctx.strokeStyle = `rgba(255, 240, 150, ${0.72 + shieldPulse * 0.2})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(tank.x, tank.y, shieldRadius + shieldPulse * 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(120, 230, 255, ${0.6 + shieldPulse * 0.25})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tank.x, tank.y, shieldRadius + 6 - shieldPulse * 2, Math.PI * 0.15, Math.PI * 1.85);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 242, 170, ${0.12 + shieldPulse * 0.08})`;
    ctx.beginPath();
    ctx.arc(tank.x, tank.y, shieldRadius + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const shieldColors = {
    3: "rgba(101, 182, 255, 0.95)",
    2: "rgba(126, 230, 255, 0.92)",
    1: "rgba(255, 206, 120, 0.95)",
  };

  ctx.strokeStyle = shieldColors[shieldHp] || "rgba(101, 182, 255, 0.9)";
  ctx.lineWidth = shieldHp >= 3 ? 4 : shieldHp === 2 ? 3 : 2;
  ctx.beginPath();
  ctx.arc(tank.x, tank.y, shieldRadius, 0, Math.PI * 2);
  ctx.stroke();

  if (shieldHp <= 2) {
    ctx.strokeStyle = shieldHp === 2 ? "rgba(200, 247, 255, 0.78)" : "rgba(255, 170, 90, 0.88)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tank.x, tank.y, shieldRadius - 4, Math.PI * 0.2, Math.PI * 1.5);
    ctx.stroke();
  }

  if (shieldHp === 1) {
    ctx.strokeStyle = "rgba(255, 135, 70, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tank.x - shieldRadius + 4, tank.y - 2);
    ctx.lineTo(tank.x - 4, tank.y + 3);
    ctx.lineTo(tank.x + shieldRadius - 5, tank.y - 5);
    ctx.stroke();
  }

  ctx.restore();
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
    if (wall.destructible) {
      ctx.fillStyle = "#b46d43";
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeStyle = "#6a3f24";
      ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
      ctx.strokeStyle = "rgba(245, 210, 165, 0.35)";
      ctx.beginPath();
      ctx.moveTo(wall.x + 2, wall.y + wall.h / 2);
      ctx.lineTo(wall.x + wall.w - 2, wall.y + wall.h / 2);
      ctx.moveTo(wall.x + wall.w / 2, wall.y + 2);
      ctx.lineTo(wall.x + wall.w / 2, wall.y + wall.h - 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#8e6038";
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeStyle = "#51351e";
      ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
    }
  }

  drawTank(
    ctx,
    {
      ...state.player,
      isPlayerShielded: state.player.ultimateShieldTime > 0 || state.player.shieldHp > 0,
      isUltimateShielded: state.player.ultimateShieldTime > 0,
    },
    state.player.invincible > 0 ? "#7da9d8" : "#5fd36a",
    "#e6f3e8"
  );

  const freezeFactor = state.effects.freeze > 0 ? 0 : state.effects.freezeRecovery > 0 ? 1 - state.effects.freezeRecovery / 3 : 1;
  const freezeStrength = 1 - freezeFactor;
  const scareStrength = Math.min(1, (state.effects.scare ?? 0) / 5);

  for (const enemy of state.enemies) {
    const enemyColor = enemy.canDropPowerUp ? "#d14f4f" : "#8f98a3";
    for (const afterImage of enemy.dashTrail ?? []) {
      const trailAlpha = Math.max(0.12, (afterImage.ttl / 0.24) * 0.35);
      drawTank(ctx, { ...enemy, ...afterImage }, enemyColor, enemy.isBoss ? "#ffd56b" : "#ffe1cd", trailAlpha);
    }
    drawTank(ctx, enemy, enemyColor, enemy.isBoss ? "#ffd56b" : "#ffe1cd");

    if (freezeStrength > 0.02) {
      const pulse = (Math.sin(Date.now() / 120 + enemy.x * 0.01) + 1) / 2;
      const auraRadius = (enemy.size ?? WORLD.tankSize) / 2 + 7 + pulse * 2;
      ctx.strokeStyle = `rgba(150, 235, 255, ${0.35 + freezeStrength * 0.35})`;
      ctx.lineWidth = 2 + freezeStrength;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, auraRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(185, 245, 255, ${0.12 + freezeStrength * 0.16})`;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, auraRadius - 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(220, 250, 255, ${0.28 + freezeStrength * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(enemy.x - 8, enemy.y);
      ctx.lineTo(enemy.x + 8, enemy.y);
      ctx.moveTo(enemy.x, enemy.y - 8);
      ctx.lineTo(enemy.x, enemy.y + 8);
      ctx.stroke();
    }

    if (scareStrength > 0.02) {
      const wobble = Math.sin(Date.now() / 90 + enemy.y * 0.03);
      ctx.strokeStyle = `rgba(236, 170, 255, ${0.35 + scareStrength * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x - 5, enemy.y - 8, 4 + wobble * 0.4, Math.PI * 0.15, Math.PI * 1.85);
      ctx.arc(enemy.x + 5, enemy.y - 8, 4 - wobble * 0.4, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 215, 255, ${0.3 + scareStrength * 0.35})`;
      ctx.beginPath();
      ctx.moveTo(enemy.x - 8, enemy.y - 13);
      ctx.lineTo(enemy.x - 5, enemy.y - 19);
      ctx.lineTo(enemy.x - 2, enemy.y - 13);
      ctx.moveTo(enemy.x + 2, enemy.y - 13);
      ctx.lineTo(enemy.x + 5, enemy.y - 19);
      ctx.lineTo(enemy.x + 8, enemy.y - 13);
      ctx.stroke();
    }
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

  const activeBoss = state.enemies.find((enemy) => enemy.isBoss);
  if (activeBoss) {
    const ratio = Math.max(0, Math.min(1, activeBoss.hp / activeBoss.maxHp));
    const barWidth = 260;
    const barHeight = 18;
    const barX = WORLD.width / 2 - barWidth / 2;
    const barY = WORLD.height - 34;
    ctx.fillStyle = "rgba(5, 10, 18, 0.78)";
    ctx.fillRect(barX - 8, barY - 22, barWidth + 16, 34);
    ctx.fillStyle = "#f6db88";
    ctx.font = "bold 14px Verdana";
    ctx.textAlign = "center";
    ctx.fillText(`${activeBoss.bossProfile.name} - HP ${Math.ceil(activeBoss.hp)}/${activeBoss.maxHp}`, WORLD.width / 2, barY - 6);
    ctx.fillStyle = "#28151b";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = activeBoss.bossProfile.accent || "#ff8c42";
    ctx.fillRect(barX, barY, barWidth * ratio, barHeight);
    ctx.strokeStyle = "#ffe9aa";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX + 0.5, barY + 0.5, barWidth - 1, barHeight - 1);
  }

  if (state.running) return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = state.won ? "#f7e49c" : "#ff9f9f";
  ctx.font = "bold 48px Verdana";
  ctx.textAlign = "center";
  ctx.fillText(state.won ? "YOU WIN" : "GAME OVER", WORLD.width / 2, WORLD.height / 2);

  if (!state.won && state.restartTimer != null) {
    ctx.fillStyle = "#f7e49c";
    ctx.font = "bold 22px Verdana";
    ctx.fillText(`Retrying in ${Math.ceil(state.restartTimer)}...`, WORLD.width / 2, WORLD.height / 2 + 44);
  }
}
