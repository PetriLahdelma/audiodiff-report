import { Command } from 'commander';
import fg from 'fast-glob';
import { readAudio } from './lib/audio-read.js';
import { alignSignals } from './lib/align.js';
import { computeMetrics } from './lib/metrics.js';
import { buildReport, writeReport } from './lib/report.js';
import { parseThresholds, evalThresholds } from './lib/thresholds.js';
import { exitCode } from './lib/utils.js';

const program = new Command();
program
  .name('audiodiff-report')
  .argument('<pathA>', 'file or directory A')
  .argument('<pathB>', 'file or directory B')
  .option('--glob <pattern>', 'glob pattern for dir comparison')
  .option('--match <mode>', 'by-name | by-order', 'by-name')
  .option('--format <fmt>', 'html | json | md', 'html')
  .option('--out <dir>', 'output directory', './audiodiff')
  .option('--json', 'print JSON summary to stdout')
  .option('--fail <expr>', 'thresholds expression')
  .option('--max-offset <seconds>', 'alignment search window', '2.0')
  .option('--downmix', 'downmix >2ch to stereo')
  .option('--ffmpeg', 'enable ffmpeg mp3 fallback')
  .action(async (pathA, pathB, opts) => {
    try {
      const maxOffset = Number(opts.maxOffset);
      if (Number.isNaN(maxOffset) || maxOffset <= 0) {
        console.error('Invalid --max-offset');
        process.exit(exitCode.INVALID_ARGS);
      }

      const isDir = pathA.endsWith('/') || pathB.endsWith('/') || opts.glob;
      const files: Array<{ a: string; b: string }> = [];

      if (isDir) {
        const glob = opts.glob || '**/*.{wav,aiff,flac,mp3}';
        const listA = await fg(glob, { cwd: pathA, onlyFiles: true });
        const listB = await fg(glob, { cwd: pathB, onlyFiles: true });
        if (opts.match === 'by-order') {
          const count = Math.min(listA.length, listB.length);
          for (let i = 0; i < count; i++) files.push({ a: listA[i], b: listB[i] });
        } else {
          const mapB = new Map(listB.map((p) => [p, p]));
          for (const a of listA) if (mapB.has(a)) files.push({ a, b: a });
        }
      } else {
        files.push({ a: pathA, b: pathB });
      }

      if (files.length === 0) {
        console.error('No matching files');
        process.exit(exitCode.INVALID_ARGS);
      }

      const results = [];
      for (const pair of files) {
        const fileA = isDir ? `${pathA}/${pair.a}` : pair.a;
        const fileB = isDir ? `${pathB}/${pair.b}` : pair.b;
        const audioA = await readAudio(fileA, { downmix: !!opts.downmix, ffmpeg: !!opts.ffmpeg });
        const audioB = await readAudio(fileB, { downmix: !!opts.downmix, ffmpeg: !!opts.ffmpeg });
        const aligned = alignSignals(audioA, audioB, { maxOffsetSec: maxOffset });
        const metrics = computeMetrics(aligned.a, aligned.b, audioA.sampleRate);
        results.push({ fileA, fileB, metrics });
      }

      const report = buildReport(results);
      await writeReport(report, opts.out, opts.format);
      if (opts.json) console.log(JSON.stringify(report, null, 2));

      if (opts.fail) {
        const thresholds = parseThresholds(opts.fail);
        const ok = evalThresholds(report, thresholds);
        if (!ok) process.exit(exitCode.THRESHOLD_FAIL);
      }

      process.exit(exitCode.OK);
    } catch (err) {
      console.error(String(err));
      process.exit(exitCode.RUNTIME_ERROR);
    }
  });

program.parse(process.argv);
