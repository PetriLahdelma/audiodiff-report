import FFT from 'fft.js';
import { AudioBufferLike, Metrics } from './types.js';
import { rms, peak } from './utils.js';

export function computeMetrics(a: AudioBufferLike, b: AudioBufferLike, sampleRate: number): Metrics {
  const monoA = downmix(a.channels);
  const monoB = downmix(b.channels);
  const diff = subtract(monoA, monoB);

  const loud = lufsApprox(diff);
  const lra = lraApprox(diff, sampleRate);
  const pk = peak(diff);
  const truePk = truePeakApprox(diff);
  const r = rms(diff);
  const crest = pk / (r || 1e-9);
  const clipping = pk >= 0.999;
  const corr = stereoCorrelation(a.channels);
  const ms = midSideRatio(a.channels);
  const dc = dcOffset(diff);
  const spectral = spectralDiff(monoA, monoB, sampleRate);
  const { leadingMs, trailingMs } = silenceDiff(diff, sampleRate);

  return { lufs: loud, lra, peak: pk, truePeak: truePk, rms: r, crest, clipping, correlation: corr, midSideRatio: ms, dcOffset: dc, spectralDiff: spectral, leadingSilenceMs: leadingMs, trailingSilenceMs: trailingMs };
}

function downmix(channels: Float32Array[]): Float32Array {
  if (channels.length === 1) return channels[0];
  const len = Math.min(channels[0].length, channels[1].length);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = (channels[0][i] + channels[1][i]) * 0.5;
  return out;
}

function subtract(a: Float32Array, b: Float32Array): Float32Array {
  const len = Math.min(a.length, b.length);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = a[i] - b[i];
  return out;
}

function lufsApprox(signal: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < signal.length; i++) sum += signal[i] * signal[i];
  const mean = sum / signal.length;
  return -0.691 + 10 * Math.log10(mean + 1e-12);
}

function lraApprox(signal: Float32Array, sr: number): number {
  const window = Math.floor(sr * 3);
  const values: number[] = [];
  for (let i = 0; i + window < signal.length; i += window) values.push(lufsApprox(signal.subarray(i, i + window)));
  values.sort((a, b) => a - b);
  if (values.length === 0) return 0;
  const p10 = values[Math.floor(values.length * 0.1)];
  const p95 = values[Math.floor(values.length * 0.95)];
  return p95 - p10;
}

function truePeakApprox(signal: Float32Array): number {
  let p = 0;
  for (let i = 0; i < signal.length - 1; i++) {
    const a = signal[i];
    const b = signal[i + 1];
    for (let j = 0; j < 4; j++) {
      const t = j / 4;
      const v = a + (b - a) * t;
      p = Math.max(p, Math.abs(v));
    }
  }
  return p;
}

function stereoCorrelation(channels: Float32Array[]): number {
  if (channels.length < 2) return 1;
  const l = channels[0];
  const r = channels[1];
  const len = Math.min(l.length, r.length);
  let sumLR = 0, sumL = 0, sumR = 0, sumLL = 0, sumRR = 0;
  for (let i = 0; i < len; i++) {
    sumLR += l[i] * r[i];
    sumL += l[i];
    sumR += r[i];
    sumLL += l[i] * l[i];
    sumRR += r[i] * r[i];
  }
  const num = sumLR - (sumL * sumR) / len;
  const den = Math.sqrt((sumLL - (sumL * sumL) / len) * (sumRR - (sumR * sumR) / len));
  return den ? num / den : 0;
}

function midSideRatio(channels: Float32Array[]): number {
  if (channels.length < 2) return 1;
  const l = channels[0];
  const r = channels[1];
  const len = Math.min(l.length, r.length);
  let mid = 0, side = 0;
  for (let i = 0; i < len; i++) {
    const m = (l[i] + r[i]) * 0.5;
    const s = (l[i] - r[i]) * 0.5;
    mid += m * m;
    side += s * s;
  }
  return mid ? side / mid : 0;
}

function dcOffset(signal: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < signal.length; i++) sum += signal[i];
  return sum / signal.length;
}

function spectralDiff(a: Float32Array, b: Float32Array, sr: number): number[] {
  const size = 2048;
  const fft = new FFT(size);
  const bands = [0, 200, 500, 2000, 6000, 12000, 20000];
  const diff = new Array(bands.length - 1).fill(0);
  const count = new Array(bands.length - 1).fill(0);

  for (let i = 0; i + size < a.length && i + size < b.length; i += size) {
    const fa = fft.createComplexArray();
    const fb = fft.createComplexArray();
    fft.realTransform(fa, a.subarray(i, i + size));
    fft.realTransform(fb, b.subarray(i, i + size));

    for (let k = 0; k < size / 2; k++) {
      const freq = (k * sr) / size;
      const band = bands.findIndex((v, idx) => freq >= v && freq < bands[idx + 1]);
      if (band < 0) continue;
      const magA = Math.hypot(fa[2 * k], fa[2 * k + 1]);
      const magB = Math.hypot(fb[2 * k], fb[2 * k + 1]);
      const db = 20 * Math.log10((magA + 1e-9) / (magB + 1e-9));
      diff[band] += Math.abs(db);
      count[band] += 1;
    }
  }

  return diff.map((d, i) => (count[i] ? d / count[i] : 0));
}

function silenceDiff(signal: Float32Array, sr: number) {
  const threshold = 0.001;
  let start = 0;
  while (start < signal.length && Math.abs(signal[start]) < threshold) start++;
  let end = signal.length - 1;
  while (end > 0 && Math.abs(signal[end]) < threshold) end--;
  return { leadingMs: (start / sr) * 1000, trailingMs: ((signal.length - end) / sr) * 1000 };
}
