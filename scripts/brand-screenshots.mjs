import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import sharp from "sharp";
import config from "../branding/brand.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const brandingDir = path.join(root, "branding");
const screenshotsDir = path.join(brandingDir, "screenshots");

const system = {
  bg: "#F5F7FB",
  panel: "#0F172A",
  panelBorder: "#253147",
  text: "#E6EDF7",
  muted: "#9AA8BD"
};

const fontSans = '"Space Grotesk","Sora","IBM Plex Sans",sans-serif';
const fontMono = '"IBM Plex Mono","JetBrains Mono",monospace';

await fs.mkdir(screenshotsDir, { recursive: true });

function svgDoc({ width, height, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">` +
    `<style>\n` +
    `:root{color-scheme:light dark;}\n` +
    `text{font-family:${fontSans};} .mono{font-family:${fontMono};}\n` +
    `</style>` +
    `${body}</svg>`;
}

function escapeText(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function panelSvg({ title, lines, transparent = false }) {
  const width = 1200;
  const height = 680;
  const padding = 48;
  const topBarHeight = 48;
  const lineHeight = 34;
  const fontSize = 22;
  const textLines = (lines ?? []).map((line, index) => {
    const y = padding + topBarHeight + (index + 1) * lineHeight;
    const fill = index === 0 ? system.text : system.muted;
    return `<text x="${padding}" y="${y}" class="mono" font-size="${fontSize}" fill="${fill}">${escapeText(line)}</text>`;
  }).join("\n");
  const headerLeft = title
    ? `<text x="${padding}" y="54" font-size="14" fill="${system.text}">${escapeText(title)}</text>`
    : "";

  const background = transparent ? "" : `<rect width="${width}" height="${height}" fill="${system.bg}"/>`;
  const body = `
    ${background}
    <defs>
      <filter id="shadow" x="0" y="0" width="200%" height="200%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <g filter="url(#shadow)">
      <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="24" fill="${system.panel}" stroke="${system.panelBorder}" stroke-width="2"/>
      <path d="M48 24h${width - 96}a24 24 0 0 1 24 24v24H24V48a24 24 0 0 1 24-24z" fill="${system.panelBorder}"/>
      <circle cx="56" cy="48" r="6" fill="#F87171"/>
      <circle cx="76" cy="48" r="6" fill="#FBBF24"/>
      <circle cx="96" cy="48" r="6" fill="#34D399"/>
    </g>
    ${headerLeft}
    <text x="${width - 180}" y="54" font-size="14" fill="${system.muted}">${config.name}</text>
    ${textLines}
  `;
  return svgDoc({ width, height, body });
}

function terminalSvg(transparent = false) {
  return panelSvg({ title: "", lines: config.demo ?? [], transparent });
}

function outputSvg(transparent = false) {
  return panelSvg({ title: "Output", lines: config.output ?? [], transparent });
}

async function writeSvg(filePath, svg) {
  const optimized = optimize(svg, {
    multipass: true,
    plugins: [
      {
        name: "preset-default",
        params: { overrides: { removeViewBox: false } }
      }
    ]
  }).data;
  await fs.writeFile(filePath, optimized, "utf8");
}

async function renderPng(svgPath, outPath, width, height) {
  const buffer = await fs.readFile(svgPath);
  let image = sharp(buffer, { density: 144 });
  if (width || height) {
    image = image.resize(width, height);
  }
  await image.png({ compressionLevel: 9, quality: 90 }).toFile(outPath);
}

async function renderPngFromSvg(svg, outPath, width, height) {
  const optimized = optimize(svg, {
    multipass: true,
    plugins: [
      {
        name: "preset-default",
        params: { overrides: { removeViewBox: false } }
      }
    ]
  }).data;
  let image = sharp(Buffer.from(optimized), { density: 144 });
  if (width || height) {
    image = image.resize(width, height);
  }
  await image.png({ compressionLevel: 9, quality: 90 }).toFile(outPath);
}

const svgPath = path.join(screenshotsDir, "terminal-demo.svg");
const pngPath = path.join(screenshotsDir, "terminal-demo.png");
const outputSvgPath = path.join(screenshotsDir, "output-demo.svg");
const outputPngPath = path.join(screenshotsDir, "output-demo.png");

await writeSvg(svgPath, terminalSvg());
await renderPngFromSvg(terminalSvg(true), pngPath, 1200, 680);
if (config.output && config.output.length > 0) {
  await writeSvg(outputSvgPath, outputSvg());
  await renderPngFromSvg(outputSvg(true), outputPngPath, 1200, 680);
}

console.log(`Screenshots generated for ${config.name}.`);
