"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { BOSS_INTERVAL, TOTAL_LEVELS } from "./game/config";
import { useTankGame } from "./game/useTankGame";
import { useTwitchChat } from "./game/useTwitchChat";

export default function Home() {
  const { canvasRef, world, hud, aiMode, grantPower, resetGame, openMainMenu, toggleAiMode } = useTankGame();
  const chatMessages = useTwitchChat();
  const [panelOpen, setPanelOpen] = useState(false);
  const { score, level, lives, enemyLeft, status, activePowerUps, showMenu, isTerminalStatus } = hud;

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
        <div className={styles.canvasFrame}>
          <canvas ref={canvasRef} className={styles.canvas} width={world.width} height={world.height} />
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
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className={styles.controls}>
        Move: WASD or Arrow Keys. Shoot: Space. Power Ups: Shield, Rapidfire, Spread Fire, Extra Life. Normal mode is capped at 2 bullets on-screen. Enemy colors: Red = can drop power-up, Gray = no drop.
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
