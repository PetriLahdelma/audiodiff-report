import fs from 'node:fs';
import path from 'node:path';
import { Report } from './types.js';

export function buildReport(results: Report['results']): Report {
  return { generatedAt: new Date().toISOString(), results };
}

export async function writeReport(report: Report, outDir: string, format: string) {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'summary.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  if (format === 'json') return;
  if (format === 'md') {
    fs.writeFileSync(path.join(outDir, 'summary.md'), mdReport(report));
    return;
  }
  fs.writeFileSync(path.join(outDir, 'report.html'), htmlReport(report));
}

function mdReport(report: Report): string {
  const lines = ['# Audio Diff Report', '', `Generated: ${report.generatedAt}`, ''];
  for (const r of report.results) {
    lines.push(`## ${r.fileA} → ${r.fileB}`);
    lines.push(`- LUFS: ${r.metrics.lufs.toFixed(2)}`);
    lines.push(`- LRA: ${r.metrics.lra.toFixed(2)}`);
    lines.push(`- True Peak: ${r.metrics.truePeak.toFixed(3)}`);
    lines.push(`- Clipping: ${r.metrics.clipping}`);
    lines.push('');
  }
  return lines.join('\n');
}

function htmlReport(report: Report): string {
  const rows = report.results.map((r) => {
    return [
      '<tr>',
      `<td>${r.fileA}</td>`,
      `<td>${r.fileB}</td>`,
      `<td>${r.metrics.lufs.toFixed(2)}</td>`,
      `<td>${r.metrics.lra.toFixed(2)}</td>`,
      `<td>${r.metrics.truePeak.toFixed(3)}</td>`,
      `<td>${r.metrics.clipping}</td>`,
      '</tr>'
    ].join('');
  }).join('');

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <title>Audio Diff Report</title>',
    '  <style>',
    '    body { font-family: system-ui, sans-serif; padding: 24px; }',
    '    table { width: 100%; border-collapse: collapse; }',
    '    th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }',
    '    th { background: #f7f7f7; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <h1>Audio Diff Report</h1>',
    `  <p>Generated: ${report.generatedAt}</p>`,
    '  <table>',
    '    <thead>',
    '      <tr><th>File A</th><th>File B</th><th>LUFS</th><th>LRA</th><th>True Peak</th><th>Clip</th></tr>',
    '    </thead>',
    `    <tbody>${rows}</tbody>`,
    '  </table>',
    '</body>',
    '</html>'
  ].join('\n');
}
