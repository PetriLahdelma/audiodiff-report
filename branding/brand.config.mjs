export default {
  name: "audiodiff-report",
  tagline: "Alignment-aware audio diffs with CI gating and producer-friendly reports.",
  value: "Align renders, compute metrics, and emit deterministic reports.",
  accent: "#EC4899",
  pills: ["Alignment","HTML report","Fail thresholds"],
  demo: ["$ audiodiff-report before.wav after.wav --format html --out ./audiodiff","Aligned offset: 0.18s","LUFS Δ: 0.32  True Peak: -0.9 dB","Report: ./audiodiff/index.html"],
  output: ["report.html","summary.json","LUFS \u0394: 0.32","true peak: -0.9 dB"],
  callout: "For MP3 support, enable `--ffmpeg` in environments where FFmpeg is available.",
  quickstart: "npx audiodiff-report before.wav after.wav --format html --out ./audiodiff",
  hero: { width: 1600, height: 900 },
  heroAccent: "none",
  icon: {
    inner: `
<rect x="136" y="112" width="240" height="288" rx="24" stroke="{{accent}}" stroke-width="{{stroke}}"/>
<line x1="324" y1="112" x2="376" y2="164" stroke="{{accent}}" stroke-width="{{stroke}}" stroke-linecap="round"/>
<line x1="324" y1="112" x2="324" y2="164" stroke="{{accent}}" stroke-width="{{stroke}}" stroke-linecap="round"/>
<line x1="324" y1="164" x2="376" y2="164" stroke="{{accent}}" stroke-width="{{stroke}}" stroke-linecap="round"/>
<path d="M176 288 L204 288 L220 248 L236 328 L252 260 L268 308 L284 272 L300 316 L316 248 L332 288 L352 288" stroke="{{accent}}" stroke-width="{{stroke}}" stroke-linecap="round" stroke-linejoin="round"/>
`
  }
};
