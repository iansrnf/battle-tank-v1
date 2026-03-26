"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import { BOSS_INTERVAL, TOTAL_LEVELS } from "./game/config";
import { useTankGame } from "./game/useTankGame";
import { useTwitchChat } from "./game/useTwitchChat";

export default function Home() {
  const { canvasRef, world, hud, aiMode, grantPower, dropRandomPower, goToLevel, resetGame, openMainMenu, toggleAiMode } = useTankGame();
  const chatMessages = useTwitchChat();
  const [panelOpen, setPanelOpen] = useState(false);
  const [thankYouAlert, setThankYouAlert] = useState(null);
  const [jumpLevelInput, setJumpLevelInput] = useState("1");
  const {
    score,
    level,
    lives,
    enemyLeft,
    status,
    activePowerUps,
    showMenu,
    isTerminalStatus,
    speedStacks,
    shieldHp,
    shieldTimer,
    ultimateShieldTime,
    rapidfireTime,
    spreadTime,
    freezeTime,
    freezeRecoveryTime,
    scareTime,
  } = hud;
  const latestAlert = useMemo(
    () => [...chatMessages].reverse().find((message) => message.kind === "alert" && message.actor && message.thankAction),
    [chatMessages]
  );

  useEffect(() => {
    if (!latestAlert) return;

    setThankYouAlert((current) => (current?.id === latestAlert.id ? current : latestAlert));
    const timeout = window.setTimeout(() => {
      setThankYouAlert((current) => (current?.id === latestAlert.id ? null : current));
    }, 5000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [latestAlert]);

  const thankYouText = thankYouAlert
    ? `Thank you ${thankYouAlert.actor} for ${thankYouAlert.thankAction}${thankYouAlert.thankDetail ? ` ${thankYouAlert.thankDetail}` : ""}`
    : "";

  const activeStatuses = [];
  if (speedStacks > 0) activeStatuses.push({ label: `Speed +${speedStacks}`, colorClass: styles.statusSpeed });
  if (ultimateShieldTime > 0) {
    activeStatuses.push({ label: `Ultimate Shield: ${Math.ceil(ultimateShieldTime)}s`, colorClass: styles.statusUltimate });
  } else if (shieldHp > 0) {
    activeStatuses.push({ label: `Shield HP ${shieldHp}/3`, colorClass: styles.statusShield });
    activeStatuses.push({ label: `Shield: ${Math.ceil(shieldTimer)}s`, colorClass: styles.statusShield });
  }
  if (rapidfireTime > 0) activeStatuses.push({ label: `Rapid: ${Math.ceil(rapidfireTime)}s`, colorClass: styles.statusRapid });
  if (spreadTime > 0) activeStatuses.push({ label: `Spread: ${Math.ceil(spreadTime)}s`, colorClass: styles.statusSpread });
  if (freezeTime > 0) activeStatuses.push({ label: `Freeze: ${Math.ceil(freezeTime)}s`, colorClass: styles.statusFreeze });
  else if (freezeRecoveryTime > 0) {
    activeStatuses.push({ label: `Freeze Recover: ${Math.ceil(freezeRecoveryTime)}s`, colorClass: styles.statusFreeze });
  }
  if (scareTime > 0) activeStatuses.push({ label: `Scare: ${Math.ceil(scareTime)}s`, colorClass: styles.statusScare });

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

      <div className={styles.gameShell}>
        <aside className={styles.statusPanel}>
          <div className={styles.panelTitle}>Power Status</div>
          <div className={styles.statusList}>
            {activeStatuses.length === 0 ? (
              <div className={styles.statusEmpty}>No active powers</div>
            ) : (
              activeStatuses.map((statusItem) => (
                <div key={statusItem.label} className={`${styles.statusPill} ${statusItem.colorClass}`}>
                  {statusItem.label}
                </div>
              ))
            )}
          </div>
        </aside>

        <div className={styles.canvasFrame}>
          <canvas ref={canvasRef} className={styles.canvas} width={world.width} height={world.height} />
          {thankYouAlert && (
            <div className={styles.thankOverlay}>
              <div className={styles.thankWave} aria-live="polite">
                {thankYouText.split("").map((char, index) => (
                  <span
                    key={`${thankYouAlert.id}-${index}`}
                    className={styles.thankChar}
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </div>
            </div>
          )}
          {showMenu && (
            <div className={styles.menuOverlay}>
              <h2 className={styles.menuTitle}>Main Menu</h2>
              <p className={styles.menuText}>Battle Tank Classic</p>
              <p className={styles.menuText}>
                {TOTAL_LEVELS} random levels, boss fights every {BOSS_INTERVAL} levels, and power-ups.
              </p>
              <button type="button" className={styles.button} onClick={resetGame}>
                Start Game
              </button>
            </div>
          )}
        </div>

        <aside className={`${styles.sidePanel} ${panelOpen ? styles.sidePanelOpen : styles.sidePanelClosed}`}>
          <button type="button" className={styles.panelToggle} onClick={() => setPanelOpen((current) => !current)}>
            {panelOpen ? "Hide Tweaks" : "Show Tweaks"}
          </button>
          {panelOpen && (
            <div className={styles.panelBody}>
              <div className={styles.panelTitle}>Tank Tweaks</div>
              <div className={styles.panelButtons}>
                <button type="button" className={styles.button} onClick={() => grantPower("shield")}>
                  Shield
                </button>
                <button type="button" className={styles.button} onClick={() => grantPower("rapidfire")}>
                  Rapidfire
                </button>
                <button type="button" className={styles.button} onClick={() => grantPower("spread")}>
                  Spread
                </button>
                <button type="button" className={styles.button} onClick={() => grantPower("extraLife")}>
                  Extra Life
                </button>
                <button type="button" className={styles.button} onClick={() => grantPower("speed")}>
                  Speed +1
                </button>
                <button type="button" className={styles.button} onClick={() => grantPower("freeze")}>
                  Freeze Time
                </button>
                <button type="button" className={styles.button} onClick={() => grantPower("scare")}>
                  Scare
                </button>
                <button type="button" className={styles.button} onClick={dropRandomPower}>
                  Random Power Up
                </button>
              </div>
              <div className={styles.jumpRow}>
                <input
                  type="number"
                  min="1"
                  max={TOTAL_LEVELS}
                  value={jumpLevelInput}
                  onChange={(event) => setJumpLevelInput(event.target.value)}
                  className={styles.jumpInput}
                  placeholder="Level"
                />
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => goToLevel(Number.parseInt(jumpLevelInput, 10))}
                >
                  Jump Level
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className={styles.controls}>
        Move: WASD or Arrow Keys. Shoot: Space. Power Ups: Shield, Rapidfire, Spread Fire, Extra Life, Freeze Time, Scare. Normal mode is capped at 2 bullets on-screen. Enemy colors: Red = can drop power-up, Gray = no drop.
      </div>

      <div className={styles.controls}>Active Power Ups: {activePowerUps}</div>

      <label className={styles.toggleRow}>
        <input type="checkbox" checked={aiMode} onChange={toggleAiMode} />
        <span>AI Mode: {aiMode ? "On" : "Off"}</span>
      </label>

      <div className={styles.buttonRow}>
        <button type="button" className={styles.button} onClick={resetGame}>
          Restart Game
        </button>
        <button type="button" className={styles.button} onClick={openMainMenu}>
          Main Menu
        </button>
      </div>

      <section className={styles.chatPanel}>
        <div className={styles.chatHeader}>Live Feed</div>
        <div className={styles.chatList}>
          {chatMessages.length === 0 ? (
            <div className={styles.chatEmpty}>Waiting for chat and alert activity...</div>
          ) : (
            chatMessages.map((message) => (
              <div
                key={message.id}
                className={
                  message.kind === "system"
                    ? styles.chatSystemMessage
                    : message.kind === "alert"
                      ? styles.chatAlertMessage
                      : styles.chatMessage
                }
              >
                {message.kind === "system" ? (
                  <span>{message.text}</span>
                ) : message.kind === "alert" ? (
                  <span>{message.text}</span>
                ) : (
                  <>
                    <span className={styles.chatUser}>{message.user}:</span> {message.text}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
