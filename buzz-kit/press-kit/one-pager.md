**Overview**
audiodiff-report provides alignment-aware audio diffs with CI gating and producer-friendly metrics.

**Problem**
Audio regressions are subtle and easy to miss in CI without deterministic metrics.

**What It Does**
- Aligns two renders before comparison.
- Computes metrics and outputs HTML, JSON, or MD reports.
- Supports CI gating with `--fail` thresholds.

**Quickstart**
```bash
npx audiodiff-report before.wav after.wav --format html --out ./audiodiff
```

**Who It Is For**
Audio teams and developers who ship renders in CI.

**Trust & Safety**
Reads local audio files and writes reports to `--out`. MP3 requires local FFmpeg with `--ffmpeg`.

**Repo**
PetriLahdelma/audiodiff-report
