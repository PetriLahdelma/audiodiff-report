# Constraints & Limitations

- WAV/AIFF/FLAC supported; MP3 requires `--ffmpeg` and FFmpeg installed.
- Runtime scales with audio duration and `--max-offset`.
- Metrics are approximations suitable for CI gating, not mastering.

Performance notes: scales with audio duration and `--max-offset`; decode + FFT dominate.
