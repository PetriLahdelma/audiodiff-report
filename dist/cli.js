import fs from 'node:fs';
import path from 'node:path';
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
    .option('--config <path>', 'config file path')
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
        const configPath = opts.config || (fs.existsSync('audiodiff.config.json') ? 'audiodiff.config.json' : null);
        if (opts.config && !fs.existsSync(opts.config)) {
            console.error(`Config not found: ${opts.config}`);
            process.exit(exitCode.INVALID_ARGS);
        }
        const config = configPath ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
        const merged = { ...config, ...opts };
        const maxOffset = Number(merged.maxOffset);
        if (Number.isNaN(maxOffset) || maxOffset <= 0) {
            console.error('Invalid --max-offset');
            process.exit(exitCode.INVALID_ARGS);
        }
        const validMatch = new Set(['by-name', 'by-order']);
        if (!validMatch.has(merged.match)) {
            console.error('Invalid --match (use by-name or by-order)');
            process.exit(exitCode.INVALID_ARGS);
        }
        const validFormats = new Set(['html', 'json', 'md']);
        if (!validFormats.has(merged.format)) {
            console.error('Invalid --format (use html, json, or md)');
            process.exit(exitCode.INVALID_ARGS);
        }
        if (!fs.existsSync(pathA) || !fs.existsSync(pathB)) {
            console.error('Input paths must exist');
            process.exit(exitCode.INVALID_ARGS);
        }
        const statA = fs.statSync(pathA);
        const statB = fs.statSync(pathB);
        const isDir = statA.isDirectory() || statB.isDirectory() || merged.glob;
        if (statA.isDirectory() !== statB.isDirectory() && !merged.glob) {
            console.error('Both inputs must be files or both must be directories');
            process.exit(exitCode.INVALID_ARGS);
        }
        const files = [];
        if (isDir) {
            const glob = merged.glob || '**/*.{wav,aiff,flac,mp3}';
            const listA = await fg(glob, { cwd: pathA, onlyFiles: true });
            const listB = await fg(glob, { cwd: pathB, onlyFiles: true });
            if (merged.match === 'by-order') {
                const count = Math.min(listA.length, listB.length);
                for (let i = 0; i < count; i++)
                    files.push({ a: listA[i], b: listB[i] });
            }
            else {
                const mapB = new Map(listB.map((p) => [p, p]));
                for (const a of listA)
                    if (mapB.has(a))
                        files.push({ a, b: a });
            }
        }
        else {
            files.push({ a: pathA, b: pathB });
        }
        if (files.length === 0) {
            console.error('No matching files');
            process.exit(exitCode.INVALID_ARGS);
        }
        const results = [];
        for (const pair of files) {
            const fileA = isDir ? path.join(pathA, pair.a) : pair.a;
            const fileB = isDir ? path.join(pathB, pair.b) : pair.b;
            const audioA = await readAudio(fileA, { downmix: !!merged.downmix, ffmpeg: !!merged.ffmpeg });
            const audioB = await readAudio(fileB, { downmix: !!merged.downmix, ffmpeg: !!merged.ffmpeg });
            const aligned = alignSignals(audioA, audioB, { maxOffsetSec: maxOffset });
            const metrics = computeMetrics(aligned.a, aligned.b, audioA.sampleRate);
            results.push({ fileA, fileB, metrics });
        }
        const report = buildReport(results);
        await writeReport(report, merged.out, merged.format);
        if (merged.json)
            console.log(JSON.stringify(report, null, 2));
        if (merged.fail) {
            const thresholds = parseThresholds(merged.fail);
            const ok = evalThresholds(report, thresholds);
            if (!ok)
                process.exit(exitCode.THRESHOLD_FAIL);
        }
        process.exit(exitCode.OK);
    }
    catch (err) {
        console.error(String(err));
        process.exit(exitCode.RUNTIME_ERROR);
    }
});
program.parse(process.argv);
