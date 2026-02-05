Title: Show: audiodiff-report — alignment-aware audio diffs for CI

Body:
I built audiodiff-report to catch audio regressions in CI. It aligns two renders, computes producer-friendly metrics, and outputs deterministic HTML/JSON/MD reports. It can also fail CI via `--fail` thresholds.

Quickstart:
```bash
npx audiodiff-report before.wav after.wav --format html --out ./audiodiff
```

Feedback welcome, especially on metrics or file formats.
