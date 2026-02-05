# FAQ

**Are LUFS/true peak exact?**
They are approximations designed for CI gating. See `docs/metric-fidelity.md`.

**Can I diff MP3 files?**
Yes, but you must enable `--ffmpeg` and have FFmpeg installed.

**How does alignment work?**
Offsets are searched up to `--max-offset` seconds. See `docs/alignment.md`.
