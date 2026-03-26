"use client";

import styles from "./page.module.css";
import { BOSS_LEVEL, TOTAL_LEVELS } from "./game/config";
import { useTankGame } from "./game/useTankGame";
import { useTwitchChat } from "./game/useTwitchChat";

export default function Home() {
  const { canvasRef, world, hud, aiMode, resetGame, openMainMenu, toggleAiMode } = useTankGame();
  const chatMessages = useTwitchChat();
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

      <div className={styles.canvasFrame}>
        <canvas ref={canvasRef} className={styles.canvas} width={world.width} height={world.height} />
        {showMenu && (
          <div className={styles.menuOverlay}>
            <h2 className={styles.menuTitle}>Main Menu</h2>
            <p className={styles.menuText}>Battle Tank Classic</p>
            <p className={styles.menuText}>
              {TOTAL_LEVELS} random levels, boss fight at level {BOSS_LEVEL}, and power-ups.
            </p>
            <button type="button" className={styles.button} onClick={resetGame}>
              Start Game
            </button>
          </div>
        )}
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
