import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import sharp from "sharp";
import config from "../branding/brand.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const demosDir = path.join(root, "branding", "demos");
const framesDir = path.join(demosDir, "frames");

const system = {
  bg: "#0B1220",
  panel: "#0F172A",
  panelBorder: "#253147",
  text: "#E6EDF7",
  muted: "#9AA8BD"
};

const fontSans = '"Space Grotesk","Sora","IBM Plex Sans",sans-serif';
const fontMono = '"IBM Plex Mono","JetBrains Mono",monospace';

const width = 1200;
const height = 680;
const padding = 48;
const topBarHeight = 48;
const lineHeight = 34;
const fontSize = 22;
const headerLeftX = padding + 72;

const fps = 24;
const gifFps = 12;
const typeSpeed = 2;
const holdShort = Math.round(fps * 0.35);
const holdLong = Math.round(fps * 0.9);

function svgDoc(body, transparent = false) {
  const background = transparent ? "" : `<rect width=\"${width}\" height=\"${height}\" fill=\"${system.bg}\"/>`;
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>` +
    `<svg width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">` +
    `<style>:root{color-scheme:dark;}text{font-family:${fontSans};}.mono{font-family:${fontMono};}</style>` +
    `${background}${body}</svg>`;
}

function escapeText(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function panelSvg({ title, lines, transparent }) {
  const textLines = (lines ?? []).map((line, index) => {
    const y = padding + topBarHeight + (index + 1) * lineHeight;
    const fill = index === 0 ? system.text : system.muted;
    return `<text x=\"${padding}\" y=\"${y}\" class=\"mono\" font-size=\"${fontSize}\" fill=\"${fill}\">${escapeText(line)}</text>`;
  }).join("\n");

  const headerLeft = title
    ? `<text x=\"${headerLeftX}\" y=\"54\" font-size=\"14\" fill=\"${system.text}\">${escapeText(title)}</text>`
    : "";

  const body = `
    <defs>
      <filter id=\"shadow\" x=\"0\" y=\"0\" width=\"200%\" height=\"200%\">\n        <feDropShadow dx=\"0\" dy=\"12\" stdDeviation=\"16\" flood-color=\"#000000\" flood-opacity=\"0.35\"/>\n      </filter>
    </defs>
    <g filter=\"url(#shadow)\">
      <rect x=\"24\" y=\"24\" width=\"${width - 48}\" height=\"${height - 48}\" rx=\"24\" fill=\"${system.panel}\" stroke=\"${system.panelBorder}\" stroke-width=\"2\"/>
      <path d=\"M48 24h${width - 96}a24 24 0 0 1 24 24v24H24V48a24 24 0 0 1 24-24z\" fill=\"${system.panelBorder}\"/>
      <circle cx=\"56\" cy=\"48\" r=\"6\" fill=\"#F87171\"/>
      <circle cx=\"76\" cy=\"48\" r=\"6\" fill=\"#FBBF24\"/>
      <circle cx=\"96\" cy=\"48\" r=\"6\" fill=\"#34D399\"/>
    </g>
    ${headerLeft}
    <text x=\"${width - 48}\" y=\"54\" font-size=\"14\" fill=\"${system.muted}\" text-anchor=\"end\">${escapeText(config.name)}</text>
    ${textLines}
  `;

  return svgDoc(body, transparent);
}

function buildFrames() {
  const frames = [];
  const demoLines = Array.isArray(config.demo) ? [...config.demo] : [];
  const outputLines = Array.isArray(config.output) ? [...config.output] : [];

  if (demoLines.length === 0) {
    return frames;
  }

  const first = demoLines[0];
  for (let i = 1; i <= first.length; i += typeSpeed) {
    const slice = first.slice(0, i);
    const cursor = i < first.length ? "|" : "";
    frames.push(panelSvg({ title: "", lines: [slice + cursor], transparent: true }));
  }

  const revealed = [first];
  for (let i = 0; i < holdShort; i += 1) {
    frames.push(panelSvg({ title: "", lines: revealed, transparent: true }));
  }

  for (let index = 1; index < demoLines.length; index += 1) {
    revealed.push(demoLines[index]);
    for (let i = 0; i < holdShort; i += 1) {
      frames.push(panelSvg({ title: "", lines: revealed, transparent: true }));
    }
  }

  for (let i = 0; i < holdLong; i += 1) {
    frames.push(panelSvg({ title: "", lines: revealed, transparent: true }));
  }

  if (outputLines.length > 0) {
    for (let i = 0; i < holdShort; i += 1) {
      frames.push(panelSvg({ title: "Output", lines: outputLines, transparent: true }));
    }
    for (let i = 0; i < holdLong; i += 1) {
      frames.push(panelSvg({ title: "Output", lines: outputLines, transparent: true }));
    }
  }

  return frames;
}

async function writeFrame(index, svg) {
  const name = String(index).padStart(4, "0");
  const filePath = path.join(framesDir, `frame-${name}.png`);
  await sharp(Buffer.from(svg), { density: 144 })
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(filePath);
}

async function run(cmd, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function ensureFramesDir() {
  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });
}

async function renderFrames(frames) {
  await ensureFramesDir();
  for (let i = 0; i < frames.length; i += 1) {
    await writeFrame(i + 1, frames[i]);
  }
}

async function renderGif() {
  const gifPath = path.join(demosDir, "demo.gif");
  const paletteFilter = `fps=${gifFps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=single:reserve_transparent=on[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:alpha_threshold=128`;
  await run("ffmpeg", [
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    String(fps),
    "-i",
    path.join(framesDir, "frame-%04d.png"),
    "-vf",
    paletteFilter,
    "-loop",
    "0",
    gifPath
  ]);
}

async function renderMp4() {
  const mp4Path = path.join(demosDir, "demo.mp4");
  const matte = `color=c=${system.bg}:s=${width}x${height}:r=${fps}[bg];[bg][0:v]overlay=shortest=1`;
  await run("ffmpeg", [
    "-loglevel",
    "error",
    "-y",
    "-framerate",
    String(fps),
    "-i",
    path.join(framesDir, "frame-%04d.png"),
    "-filter_complex",
    matte,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-movflags",
    "+faststart",
    mp4Path
  ]);
}

await fs.mkdir(demosDir, { recursive: true });
const frames = buildFrames();
if (frames.length === 0) {
  console.log(`No demo lines configured for ${config.name}.`);
  process.exit(0);
}

await renderFrames(frames);
await renderGif();
await renderMp4();

console.log(`Demo assets generated for ${config.name}.`);
