I just released audiodiff-report, a CLI for alignment-aware audio diffs with CI gating. It aligns two renders, computes producer-friendly metrics, and outputs deterministic HTML/JSON/MD reports.

Quickstart:
```bash
npx audiodiff-report before.wav after.wav --format html --out ./audiodiff
```

If you ship audio in CI, I would love your feedback on metrics or formats.
