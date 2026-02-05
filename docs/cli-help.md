# CLI Help

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
