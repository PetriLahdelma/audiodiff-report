import { it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';

it('CLI returns invalid args on missing file', () => {
  const res = spawnSync('node', ['dist/cli.js', 'nope.wav', 'nope.wav']);
  expect(res.status).toBe(4);
});
