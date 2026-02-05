# Alignment Strategy

- Signals are aligned by searching up to `--max-offset` seconds.
- Larger offsets increase runtime linearly.
- For large batches, tune `--max-offset` to keep CI fast.
