import { expect, it } from 'vitest';
import { parseThresholds } from '../../src/lib/thresholds.js';

it('parses thresholds with surrounding whitespace', () => {
  expect(parseThresholds(' lufs <= -14 , clipping = false ')).toEqual([
    { key: 'lufs', op: '<=', value: '-14' },
    { key: 'clipping', op: '=', value: 'false' }
  ]);
});

it('rejects thresholds with trailing garbage', () => {
  expect(() => parseThresholds('lufs<=-14oops')).toThrow(/Invalid threshold/);
});
