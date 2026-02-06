import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { writeReport } from '../../src/lib/report.js';

it('escapes file names in generated HTML report', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audiodiff-report-'));
  const report = {
    generatedAt: '2026-02-06T00:00:00Z',
    results: [
      {
        fileA: '<script>alert(1)</script>.wav',
        fileB: 'normal.wav',
        metrics: {
          lufs: -14,
          lra: 3,
          peak: 0.5,
          truePeak: 0.52,
          rms: 0.2,
          crest: 2.5,
          clipping: false,
          correlation: 1,
          midSideRatio: 0,
          dcOffset: 0,
          spectralDiff: [0, 0, 0, 0, 0, 0],
          leadingSilenceMs: 0,
          trailingSilenceMs: 0
        }
      }
    ]
  };

  await writeReport(report, dir, 'html');
  const html = fs.readFileSync(path.join(dir, 'report.html'), 'utf8');
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;.wav');
  expect(html).not.toContain('<script>alert(1)</script>.wav');
});
