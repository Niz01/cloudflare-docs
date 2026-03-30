import { Platform } from 'react-native';

// Web Audio API-based sound effects for chess
// Works on web (itch.io) and falls back gracefully on native

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  delay: number = 0
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const startTime = ctx.currentTime + delay;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function playNoise(duration: number, volume: number = 0.08) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, ctx.currentTime);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start();
}

// Chess sound effects
export const ChessSounds = {
  // Subtle wood tap for piece placement
  move: () => {
    playNoise(0.08, 0.12);
    playTone(800, 0.06, 'sine', 0.06);
  },

  // Slightly sharper sound for captures
  capture: () => {
    playNoise(0.12, 0.18);
    playTone(400, 0.08, 'triangle', 0.1);
    playTone(600, 0.06, 'sine', 0.05, 0.03);
  },

  // Alert tone for check
  check: () => {
    playTone(880, 0.12, 'sine', 0.12);
    playTone(1100, 0.1, 'sine', 0.08, 0.08);
  },

  // Short dramatic sequence for checkmate
  checkmate: () => {
    playTone(523, 0.15, 'triangle', 0.12);
    playTone(659, 0.15, 'triangle', 0.12, 0.12);
    playTone(784, 0.15, 'triangle', 0.12, 0.24);
    playTone(1047, 0.3, 'triangle', 0.15, 0.36);
  },

  // Soft tone for game start
  gameStart: () => {
    playTone(523, 0.15, 'sine', 0.08);
    playTone(659, 0.2, 'sine', 0.08, 0.12);
  },

  // Draw/stalemate
  draw: () => {
    playTone(440, 0.2, 'sine', 0.08);
    playTone(330, 0.3, 'sine', 0.06, 0.15);
  },

  // Subtle click for piece selection
  select: () => {
    playTone(1200, 0.04, 'sine', 0.05);
  },

  // Soft error for invalid move
  invalid: () => {
    playTone(200, 0.1, 'sine', 0.06);
  },

  // Initialize audio context (call on first user interaction)
  init: () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  },
};
