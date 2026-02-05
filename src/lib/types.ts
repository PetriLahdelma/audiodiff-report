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
