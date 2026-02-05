import { it, expect } from 'vitest';
import { computeMetrics } from '../../src/lib/metrics.js';

it('computes metrics for silence', () => {
  const buf = { sampleRate: 48000, channels: [new Float32Array(48000)] };
  const metrics = computeMetrics(buf, buf, 48000);
  expect(metrics.dcOffset).toBeCloseTo(0, 6);
  expect(metrics.clipping).toBe(false);
});
