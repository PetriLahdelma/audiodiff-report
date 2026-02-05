Show HN: audiodiff-report — alignment-aware audio diffs with CI gating and producer-friendly metrics

audiodiff-report aligns two renders, computes metrics like LUFS and true peak, and outputs deterministic HTML/JSON/MD reports. Quickstart:

```bash
npx audiodiff-report before.wav after.wav --format html --out ./audiodiff
```

It also supports directory mode and `--fail` thresholds for CI gating.
