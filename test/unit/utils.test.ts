import { expect, it } from 'vitest';
import { ensureMatchingSampleRates } from '../../src/lib/utils.js';

it('accepts identical sample rates', () => {
  expect(() => ensureMatchingSampleRates(48000, 48000)).not.toThrow();
});

it('throws on sample rate mismatch', () => {
  expect(() => ensureMatchingSampleRates(44100, 48000)).toThrow(/Sample rate mismatch/);
});
