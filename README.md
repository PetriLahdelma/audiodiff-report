<picture>
  <source srcset="branding/hero.svg" type="image/svg+xml">
  <img alt="audiodiff-report hero" src="branding/hero.png" width="100%">
</picture>

# audiodiff-report
Alignment-aware audio diffs with CI gating and producer-friendly metrics. Align renders, compute metrics, and emit deterministic reports.

![CI](https://github.com/PetriLahdelma/audiodiff-report/actions/workflows/ci.yml/badge.svg) ![Release](https://img.shields.io/github/v/release/PetriLahdelma/audiodiff-report) ![License](https://img.shields.io/github/license/PetriLahdelma/audiodiff-report) ![Stars](https://img.shields.io/github/stars/PetriLahdelma/audiodiff-report)

> [!IMPORTANT]
> For MP3 support, enable `--ffmpeg` in environments where FFmpeg is available.

## Quickstart
```bash
npx audiodiff-report before.wav after.wav --format html --out ./audiodiff
```

## Demo
![Terminal Demo](branding/screenshots/terminal-demo.svg)

```bash
audiodiff-report before.wav after.wav --format html --out ./audiodiff
```

## Docs
Start here: [Installation](#installation) · [Configuration](#configuration) · [CLI Help](#cli-help) · [Audio Regression Testing in CI](#audio-regression-testing-in-ci) · [Troubleshooting](#troubleshooting)

## Contributing
See `CONTRIBUTING.md`.

## Problem Statement
Audio regressions are subtle and easy to miss in CI. This tool aligns renders, measures perceptual metrics, and produces a deterministic report you can gate on.

## Requirements

- Node.js 20+
- Optional: FFmpeg (only when using `--ffmpeg` for MP3 decode fallback)

## Installation
```bash
npm i -D audiodiff-report
```

## Examples
```bash
npx audiodiff-report before.wav after.wav --format json --out ./audiodiff
npx audiodiff-report before.wav after.wav --fail "lufs>0.3,tp>-1.0,clip=true,dc>0.01"
```

## Configuration

`audiodiff.config.json` is auto-detected if present, or pass `--config <path>`.

```json
{
  "format": "html",
  "out": "./audiodiff",
  "match": "by-name",
  "maxOffset": 2.0
}
```

## CLI Help
```text
Usage: audiodiff-report [options] <pathA> <pathB>

Options:
  --glob <pattern>          Glob pattern for dir comparison
  --match <mode>            by-name | by-order (default: by-name)
  --format <fmt>            html | json | md (default: html)
  --out <dir>               Output directory (default: ./audiodiff)
  --json                    Print JSON summary to stdout
  --fail <expr>             Thresholds, e.g. "lufs>0.3,tp>-1.0,clip=true"
  --max-offset <seconds>    Max alignment search window (default: 2.0)
  --downmix                 Downmix multichannel to stereo
  --ffmpeg                  Enable FFmpeg MP3 decode fallback (optional)
  -h, --help                Display help
```

## Screenshots
- `assets/report-preview.png`

## FAQ
**MP3 support?**
Not by default. Preferred inputs are WAV/AIFF/FLAC. MP3 requires FFmpeg and `--ffmpeg`.

**LUFS compliance?**
Uses a pragmatic approximation for deterministic CI.

## Troubleshooting
- **Different lengths**: increase `--max-offset`.
- **Channel mismatch**: use `--downmix`.

## Exit Codes

- `0` Success
- `2` Thresholds failed
- `3` Runtime error
- `4` Invalid arguments

## How It Works
1. Decode to PCM.
2. Align using cross-correlation.
3. Compute metrics (LUFS approx, LRA approx, true peak approx, RMS, crest, correlation, DC offset, spectral bands).
4. Emit HTML/JSON/MD report.

## Audio Regression Testing in CI
```yaml
- uses: PetriLahdelma/audiodiff-report/.github/actions/audiodiff-report@v0.1.0
  with:
    before-path: ./renders/before
    after-path: ./renders/after
    glob: "**/*.{wav,aiff,flac}"
    thresholds: "lufs>0.3,tp>-1.0,clip=true"
    upload-artifact: true
    comment: true
```

## License
MIT.

