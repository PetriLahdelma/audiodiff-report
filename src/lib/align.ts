import { AudioBufferLike } from './types.js';

export function alignSignals(a: AudioBufferLike, b: AudioBufferLike, opts: { maxOffsetSec: number }) {
  const sr = a.sampleRate;
  const maxOffset = Math.floor(opts.maxOffsetSec * sr);
  const monoA = downmix(a.channels);
  const monoB = downmix(b.channels);
  let bestOffset = 0;
  let bestScore = -Infinity;

  for (let offset = -maxOffset; offset <= maxOffset; offset += Math.max(1, Math.floor(sr / 200))) {
    const score = crossCorr(monoA, monoB, offset);
    if (score > bestScore) {
      bestScore = score;
      bestOffset = offset;
    }
  }

  return { a: shiftBuffer(a, 0), b: shiftBuffer(b, bestOffset) };
}

function downmix(channels: Float32Array[]): Float32Array {
  if (channels.length === 1) return channels[0];
  const len = Math.min(channels[0].length, channels[1].length);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = (channels[0][i] + channels[1][i]) * 0.5;
  return out;
}

function crossCorr(a: Float32Array, b: Float32Array, offset: number): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < a.length; i++) {
    const j = i + offset;
    if (j < 0 || j >= b.length) continue;
    sum += a[i] * b[j];
    count++;
  }
  return count ? sum / count : -Infinity;
}

function shiftBuffer(buf: AudioBufferLike, offset: number): AudioBufferLike {
  const channels = buf.channels.map((ch) => shift(ch, offset));
  return { sampleRate: buf.sampleRate, channels };
}

function shift(ch: Float32Array, offset: number): Float32Array {
  const out = new Float32Array(ch.length);
  for (let i = 0; i < ch.length; i++) {
    const j = i + offset;
    if (j >= 0 && j < ch.length) out[j] = ch[i];
  }
  return out;
}
