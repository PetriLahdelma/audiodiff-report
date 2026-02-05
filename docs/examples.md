# Examples

```bash
npx audiodiff-report before.wav after.wav --format json --out ./audiodiff
npx audiodiff-report before.wav after.wav --fail "lufs>0.3,tp>-1.0,clip=true,dc>0.01"
```

See `examples/report.html` and `examples/summary.json` for committed sample outputs.
