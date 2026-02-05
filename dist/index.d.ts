export type AudioBufferLike = { sampleRate: number; channels: Float32Array[] };

export type Metrics = {
  lufs: number;
  lra: number;
  peak: number;
  truePeak: number;
  rms: number;
  crest: number;
  clipping: boolean;
  correlation: number;
  midSideRatio: number;
  dcOffset: number;
  spectralDiff: number[];
  leadingSilenceMs: number;
  trailingSilenceMs: number;
};

export type Report = {
  generatedAt: string;
  results: Array<{ fileA: string; fileB: string; metrics: Metrics }>;
};

export declare function computeMetrics(a: AudioBufferLike, b: AudioBufferLike, sampleRate: number): Metrics;
export declare function alignSignals(
  a: AudioBufferLike,
  b: AudioBufferLike,
  opts: { maxOffsetSec: number }
): { a: AudioBufferLike; b: AudioBufferLike };
export declare function parseThresholds(expr: string): Array<{ key: string; op: string; value: string }>;
export declare function evalThresholds(report: Report, thresholds: Array<{ key: string; op: string; value: string }>): boolean;
