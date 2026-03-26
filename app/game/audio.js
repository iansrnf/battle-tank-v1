"use client";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

class TankAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.started = false;
    this.musicClock = 0;
    this.musicStep = 0;
    this.lastMusicMode = "menu";
    this.lastMusicLevel = 1;
  }

  ensureContext() {
    if (typeof window === "undefined") return null;
    if (this.ctx) return this.ctx;

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;

    this.ctx = new AudioContextCtor();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.master.gain.value = 0.8;
    this.musicGain.gain.value = 0.22;
    this.sfxGain.gain.value = 0.28;

    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  async unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }
    this.started = ctx.state === "running";
  }

  pulse({ time, frequency, duration, type = "square", volume = 0.15, slideTo = null }) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    if (slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), time + duration);
    }

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  noise({ time, duration, volume = 0.12, filter = 800 }) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
    }

    const source = ctx.createBufferSource();
    const biquad = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = buffer;
    biquad.type = "lowpass";
    biquad.frequency.setValueAtTime(filter, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(biquad);
    biquad.connect(gain);
    gain.connect(this.sfxGain);
    source.start(time);
    source.stop(time + duration + 0.02);
  }

  play(name) {
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running") return;
    const time = ctx.currentTime + 0.01;

    switch (name) {
      case "playerShoot":
        this.pulse({ time, frequency: 520, duration: 0.08, volume: 0.08, slideTo: 310, type: "square" });
        break;
      case "enemyShoot":
        this.pulse({ time, frequency: 210, duration: 0.08, volume: 0.06, slideTo: 170, type: "sawtooth" });
        break;
      case "explosion":
        this.noise({ time, duration: 0.2, volume: 0.16, filter: 900 });
        this.pulse({ time, frequency: 110, duration: 0.14, volume: 0.09, slideTo: 60, type: "triangle" });
        break;
      case "powerUp":
        this.pulse({ time, frequency: 440, duration: 0.08, volume: 0.09, slideTo: 660, type: "triangle" });
        this.pulse({ time: time + 0.08, frequency: 660, duration: 0.12, volume: 0.08, slideTo: 880, type: "triangle" });
        break;
      case "shield":
        this.pulse({ time, frequency: 320, duration: 0.18, volume: 0.08, slideTo: 480, type: "sine" });
        break;
      case "freeze":
        this.pulse({ time, frequency: 540, duration: 0.18, volume: 0.07, slideTo: 220, type: "triangle" });
        break;
      case "scare":
        this.pulse({ time, frequency: 260, duration: 0.14, volume: 0.08, slideTo: 420, type: "sawtooth" });
        this.pulse({ time: time + 0.09, frequency: 390, duration: 0.12, volume: 0.06, slideTo: 520, type: "sawtooth" });
        break;
      case "chatCommand":
        this.pulse({ time, frequency: 700, duration: 0.07, volume: 0.08, slideTo: 420, type: "square" });
        this.pulse({ time: time + 0.06, frequency: 560, duration: 0.07, volume: 0.07, slideTo: 760, type: "square" });
        break;
      case "support":
        this.pulse({ time, frequency: 523, duration: 0.1, volume: 0.08, type: "triangle" });
        this.pulse({ time: time + 0.08, frequency: 659, duration: 0.1, volume: 0.08, type: "triangle" });
        this.pulse({ time: time + 0.16, frequency: 784, duration: 0.14, volume: 0.08, type: "triangle" });
        break;
      case "levelUp":
        this.pulse({ time, frequency: 392, duration: 0.1, volume: 0.08, type: "triangle" });
        this.pulse({ time: time + 0.08, frequency: 523, duration: 0.1, volume: 0.08, type: "triangle" });
        this.pulse({ time: time + 0.16, frequency: 659, duration: 0.14, volume: 0.08, type: "triangle" });
        break;
      case "gameOver":
        this.pulse({ time, frequency: 260, duration: 0.18, volume: 0.08, slideTo: 180, type: "sawtooth" });
        this.pulse({ time: time + 0.16, frequency: 180, duration: 0.22, volume: 0.07, slideTo: 110, type: "sawtooth" });
        break;
      case "victory":
        this.pulse({ time, frequency: 523, duration: 0.1, volume: 0.08, type: "triangle" });
        this.pulse({ time: time + 0.08, frequency: 659, duration: 0.1, volume: 0.08, type: "triangle" });
        this.pulse({ time: time + 0.16, frequency: 784, duration: 0.12, volume: 0.08, type: "triangle" });
        this.pulse({ time: time + 0.26, frequency: 1046, duration: 0.16, volume: 0.09, type: "triangle" });
        break;
      default:
        break;
    }
  }

  getLevelPalette(mode, level) {
    if (mode === "menu") return [261.63, 329.63, 392.0, 523.25];
    if (mode === "victory") return [523.25, 659.25, 783.99, 1046.5];
    if (mode === "gameOver") return [196.0, 185.0, 164.81, 146.83];

    const roots = [196.0, 220.0, 246.94, 261.63, 293.66, 329.63];
    const intervalsByTheme = [
      [1, 1.25, 1.5, 2, 1.5, 1.25, 1.125, 1.5],
      [1, 1.125, 1.333, 1.5, 1.777, 1.5, 1.333, 1.125],
      [1, 1.2, 1.5, 1.8, 2.25, 1.8, 1.5, 1.2],
      [1, 1.333, 1.6, 2, 1.6, 1.333, 1.2, 1.6],
    ];
    const root = roots[(level - 1) % roots.length];
    const theme = intervalsByTheme[(Math.floor((level - 1) / 3) + level) % intervalsByTheme.length];
    const octaveLift = 1 + (Math.floor((level - 1) / 10) % 2) * 0.5;
    return theme.map((interval, index) => root * interval * (index % 4 === 3 ? octaveLift : 1));
  }

  tickMusic(mode, level) {
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running" || !this.musicGain) return;

    const now = ctx.currentTime;
    if (mode !== this.lastMusicMode || level !== this.lastMusicLevel) {
      this.musicStep = 0;
      this.musicClock = now;
      this.lastMusicMode = mode;
      this.lastMusicLevel = level;
    }
    if (now < this.musicClock) return;

    const palette = this.getLevelPalette(mode, level);
    const note = palette[this.musicStep % palette.length];
    const stepLength = mode === "play" ? clamp(0.34 - level * 0.002, 0.2, 0.34) : 0.36;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = mode === "play" ? (level % 5 === 0 ? "sawtooth" : "triangle") : "sine";
    osc.frequency.setValueAtTime(note, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(mode === "play" ? 0.045 + Math.min(0.02, level * 0.0008) : 0.035, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + stepLength * 0.92);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + stepLength);

    if (mode === "play") {
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = level % 2 === 0 ? "square" : "triangle";
      bass.frequency.setValueAtTime(note / (level % 3 === 0 ? 1.5 : 2), now);
      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.exponentialRampToValueAtTime(0.018 + Math.min(0.01, level * 0.0004), now + 0.01);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + stepLength * 0.88);
      bass.connect(bassGain);
      bassGain.connect(this.musicGain);
      bass.start(now);
      bass.stop(now + stepLength);
    }

    this.musicClock = now + stepLength;
    this.musicStep += 1;
  }

  sync(prevState, nextState) {
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== "running") return;

    const nextMode = !nextState.running ? (nextState.won ? "victory" : "gameOver") : nextState.mode === "menu" ? "menu" : "play";
    this.tickMusic(nextMode, nextState.level ?? 1);

    if (!prevState) return;

    const prevPlayerBullets = prevState.bullets.filter((bullet) => bullet.owner === "player").length;
    const nextPlayerBullets = nextState.bullets.filter((bullet) => bullet.owner === "player").length;
    if (nextPlayerBullets > prevPlayerBullets) this.play("playerShoot");

    const prevEnemyBullets = prevState.bullets.filter((bullet) => bullet.owner === "enemy").length;
    const nextEnemyBullets = nextState.bullets.filter((bullet) => bullet.owner === "enemy").length;
    if (nextEnemyBullets > prevEnemyBullets) this.play("enemyShoot");

    if (nextState.explosions.length > prevState.explosions.length) this.play("explosion");
    if (nextState.powerUps.length < prevState.powerUps.length) this.play("powerUp");

    if (nextState.player.ultimateShieldTime > prevState.player.ultimateShieldTime || nextState.player.shieldHp > prevState.player.shieldHp) {
      this.play("shield");
    }

    if ((nextState.effects.freeze ?? 0) > (prevState.effects.freeze ?? 0)) this.play("freeze");
    if ((nextState.effects.scare ?? 0) > (prevState.effects.scare ?? 0)) this.play("scare");
    if ((nextState.effects.chatCommandTime ?? 0) > (prevState.effects.chatCommandTime ?? 0)) this.play("chatCommand");
    if ((nextState.effects.chatImmunity ?? 0) > (prevState.effects.chatImmunity ?? 0)) this.play("support");

    if (nextState.level > prevState.level) this.play("levelUp");
    if (nextState.running !== prevState.running) {
      if (!nextState.running && nextState.won) this.play("victory");
      if (!nextState.running && !nextState.won) this.play("gameOver");
    }
  }
}

let singleton = null;

export function getTankAudio() {
  if (!singleton) singleton = new TankAudio();
  return singleton;
}
