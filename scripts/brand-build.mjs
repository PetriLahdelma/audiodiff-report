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
  bg: "#0B0D12",
  panel: "#111827",
  panelSoft: "#0F172A",
  grid: "#1F2A37",
  text: "#E6EDF7",
  muted: "#9AA8BD",
  faint: "#263142"
};

const fontSans = '"Space Grotesk","Sora","IBM Plex Sans",sans-serif';
const fontMono = '"IBM Plex Mono","JetBrains Mono",monospace';

await fs.mkdir(brandingDir, { recursive: true });
await fs.mkdir(screenshotsDir, { recursive: true });

const accent = config.accent;

function applyTokens(source, tokens) {
  let out = source;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.replaceAll(`{{${key}}}`, String(value));
  }
  return out;
}

function svgDoc({ width, height, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">` +
    `<style>\n` +
    `:root{color-scheme:light dark;}\n` +
    `text{font-family:${fontSans};} .mono{font-family:${fontMono};}\n` +
    `</style>` +
    `${body}</svg>`;
}

const iconStroke = 28;

function iconInnerMarkup() {
  return applyTokens(config.icon.inner, {
    accent,
    stroke: iconStroke,
    grid: system.grid,
    text: system.text,
    muted: system.muted
  });
}

async function loadCustomIcon() {
  const customPath = path.join(brandingDir, "icon.custom.svg");
  try {
    return await fs.readFile(customPath, "utf8");
  } catch {
    return null;
  }
}

function extractSvgData(svg) {
  const match = svg.match(/<svg[^>]*>/i);
  if (!match) {
    return { inner: svg, minX: 0, minY: 0, width: 512, height: 512 };
  }
  const svgTag = match[0];
  const start = match.index + svgTag.length;
  const end = svg.lastIndexOf("</svg>");
  const inner = svg.slice(start, end > start ? end : svg.length);
  const viewBoxMatch = svgTag.match(/viewBox="([^"]+)"/i);
  let minX = 0;
  let minY = 0;
  let width = null;
  let height = null;
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[ ,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      minX = parts[0];
      minY = parts[1];
      width = parts[2];
      height = parts[3];
    }
  }
  const widthMatch = svgTag.match(/width="([^"]+)"/i);
  const heightMatch = svgTag.match(/height="([^"]+)"/i);
  const parseSize = (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : null;
  };
  if (!width) width = parseSize(widthMatch?.[1]);
  if (!height) height = parseSize(heightMatch?.[1]);
  if (!width) width = 512;
  if (!height) height = 512;
  return { inner, minX, minY, width, height };
}

const customIconRaw = await loadCustomIcon();
const customIconData = customIconRaw ? extractSvgData(customIconRaw) : null;

function buildDefaultIconBody() {
  return `
    <rect x="32" y="32" width="448" height="448" rx="96" fill="${system.panel}"/>
    <rect x="52" y="52" width="408" height="408" rx="84" stroke="${system.faint}" stroke-width="2"/>
    ${iconInnerMarkup()}
  `;
}

function iconSvg() {
  if (customIconRaw) {
    return customIconRaw;
  }
  const body = buildDefaultIconBody();
  return svgDoc({ width: 512, height: 512, body });
}

function iconGroup({ x, y, size }) {
  if (!customIconData) {
    const scale = size / 512;
    return `
      <g transform="translate(${x} ${y}) scale(${scale.toFixed(4)})">
        ${buildDefaultIconBody()}
      </g>
    `;
  }
  const { inner, minX, minY, width, height } = customIconData;
  const scale = size / Math.max(width, height);
  const offsetX = x + (size - width * scale) / 2 - minX * scale;
  const offsetY = y + (size - height * scale) / 2 - minY * scale;
  return `
    <g transform="translate(${offsetX.toFixed(2)} ${offsetY.toFixed(2)}) scale(${scale.toFixed(4)})">
      ${inner}
    </g>
  `;
}

function wordmarkSvg() {
  const fontSize = 96;
  const width = Math.max(840, Math.round(config.name.length * 52 + 260));
  const height = 200;
  const body = `
    <text x="0" y="130" font-size="${fontSize}" font-weight="700" letter-spacing="-0.02em" fill="${system.text}">${config.name}</text>
  `;
  return svgDoc({ width, height, body });
}

function lockupSvg() {
  const iconSize = 180;
  const gap = 36;
  const textX = iconSize + gap;
  const width = Math.max(900, Math.round(config.name.length * 46 + 360));
  const height = 240;
  const body = `
    ${iconGroup({ x: 0, y: 30, size: iconSize })}
    <text x="${textX}" y="150" font-size="86" font-weight="700" letter-spacing="-0.02em" fill="${system.text}">${config.name}</text>
  `;
  return svgDoc({ width, height, body });
}

function buildGridLines(width, height, step = 80) {
  const lines = [];
  for (let x = step; x < width; x += step) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" />`);
  }
  for (let y = step; y < height; y += step) {
    lines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" />`);
  }
  return lines.join("\n");
}

function pillGroup({ x, y, labels, fontSize = 24 }) {
  const paddingX = 12;
  const height = 40;
  const textY = height / 2;
  let cursorX = x;
  const pills = labels.map((label) => {
    const width = Math.round(label.length * fontSize * 0.52 + paddingX * 2);
    const textX = Math.round(width / 2);
    const pill = `
      <g transform="translate(${cursorX} ${y})">
        <rect width="${width}" height="${height}" rx="20" fill="${system.panel}" stroke="${system.faint}" stroke-width="1" />
        <text x="${textX}" y="${textY}" font-size="${fontSize}" fill="${system.text}" dominant-baseline="middle" text-anchor="middle">${label}</text>
      </g>
    `;
    cursorX += width + 14;
    return pill;
  });
  return pills.join("\n");
}

function wrapLines(text, maxWidth, fontSize, maxLines = 2) {
  if (!text) return [""];
  const approxCharWidth = fontSize * 0.56;
  const maxChars = Math.max(8, Math.floor(maxWidth / approxCharWidth));
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  const remaining = lines.slice(maxLines - 1).join(" ");
  let last = remaining;
  if (last.length > maxChars) {
    last = `${last.slice(0, Math.max(0, maxChars - 3))}...`;
  }
  kept[maxLines - 1] = last;
  return kept;
}

function renderTextLines({ x, y, lines, fontSize, lineHeight, fill, weight = null, letterSpacing = null }) {
  return lines.map((line, index) => {
    const attrs = [
      `x=\"${x}\"`,
      `y=\"${y + index * lineHeight}\"`,
      `font-size=\"${fontSize}\"`,
      `fill=\"${fill}\"`
    ];
    if (weight) attrs.push(`font-weight=\"${weight}\"`);
    if (letterSpacing) attrs.push(`letter-spacing=\"${letterSpacing}\"`);
    return `<text ${attrs.join(" ")}>${line}</text>`;
  }).join("\n");
}

function heroAccent(position = "right") {
  if (position === "none") return "";
  const preset = position === "bottom"
    ? {
        dots: [
          { x: 1300, y: 660 },
          { x: 1340, y: 660 },
          { x: 1380, y: 660 }
        ],
        bars: [
          { x: 1180, y: 700, w: 180, o: 0.35 },
          { x: 1180, y: 730, w: 220, o: 0.18 },
          { x: 1180, y: 760, w: 150, o: 0.28 }
        ]
      }
    : {
        dots: [
          { x: 1320, y: 260 },
          { x: 1360, y: 260 },
          { x: 1400, y: 260 }
        ],
        bars: [
          { x: 1240, y: 300, w: 180, o: 0.35 },
          { x: 1240, y: 330, w: 220, o: 0.18 },
          { x: 1240, y: 360, w: 150, o: 0.28 }
        ]
      };

  const dots = preset.dots
    .map((dot) => `<circle cx="${dot.x}" cy="${dot.y}" r="6" fill="${accent}"/>`)
    .join("\n");
  const bars = preset.bars
    .map((bar) => `<rect x="${bar.x}" y="${bar.y}" width="${bar.w}" height="12" rx="6" fill="${accent}" fill-opacity="${bar.o}"/>`)
    .join("\n");

  return `
    <g opacity="0.6">
      ${dots}
      ${bars}
    </g>
  `;
}

function heroSvg() {
  const width = config.hero?.width ?? 1600;
  const height = config.hero?.height ?? 900;
  const radius = config.heroRadius ?? 36;
  const iconSize = 420;
  const iconX = 120;
  const iconY = 220;
  const grid = buildGridLines(width, height, 80);
  const pills = pillGroup({ x: 760, y: 540, labels: config.pills });
  const titleLines = Array.isArray(config.heroTitleLines) ? config.heroTitleLines : [config.name];
  const titleSize = config.heroTitleSize ?? 72;
  const titleLineHeight = config.heroTitleLineHeight ?? Math.round(titleSize * 1.05);
  const titleY = config.heroTitleY ?? 320;
  const taglineLines = wrapLines(
    config.tagline,
    config.heroTaglineWidth ?? 720,
    config.heroTaglineSize ?? 30,
    config.heroTaglineLines ?? 2
  );
  const taglineY = config.heroTaglineY ?? (titleY + titleLineHeight * titleLines.length + 24);
  const body = `
    <defs>
      <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(320 340) rotate(45) scale(420)">
        <stop stop-color="${accent}" stop-opacity="0.35"/>
        <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
      <clipPath id="heroClip">
        <rect width="${width}" height="${height}" rx="${radius}"/>
      </clipPath>
    </defs>
    <g clip-path="url(#heroClip)">
      <rect width="${width}" height="${height}" fill="${system.bg}"/>
      <rect width="${width}" height="${height}" fill="url(#glow)"/>
      <g opacity="0.25" stroke="${system.grid}" stroke-width="1">
        ${grid}
      </g>
      ${iconGroup({ x: iconX, y: iconY, size: iconSize })}
      ${renderTextLines({
      x: 760,
      y: titleY,
      lines: titleLines,
      fontSize: titleSize,
      lineHeight: titleLineHeight,
      fill: system.text,
      weight: 700,
      letterSpacing: "-0.02em"
    })}
      ${renderTextLines({
      x: 760,
      y: taglineY,
      lines: taglineLines,
      fontSize: config.heroTaglineSize ?? 30,
      lineHeight: config.heroTaglineLineHeight ?? 38,
      fill: system.muted
    })}
      ${pills}
      ${heroAccent(config.heroAccent ?? "right")}
    </g>
  `;
  return svgDoc({ width, height, body });
}

function socialCardSvg() {
  const width = 1280;
  const height = 640;
  const iconSize = 240;
  const grid = buildGridLines(width, height, 80);
  const pills = pillGroup({ x: 520, y: 420, labels: config.pills.slice(0, 2), fontSize: 22 });
  const titleLines = Array.isArray(config.socialTitleLines) ? config.socialTitleLines : [config.name];
  const titleSize = config.socialTitleSize ?? 60;
  const titleLineHeight = config.socialTitleLineHeight ?? Math.round(titleSize * 1.05);
  const titleY = config.socialTitleY ?? 270;
  const valueLines = wrapLines(
    config.value,
    config.socialValueWidth ?? 640,
    config.socialValueSize ?? 26,
    config.socialValueLines ?? 2
  );
  const valueY = config.socialValueY ?? (titleY + titleLineHeight * titleLines.length + 22);
  const body = `
    <defs>
      <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${accent}" stop-opacity="0.18"/>
        <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="${system.bg}"/>
    <rect width="${width}" height="${height}" fill="url(#edge)"/>
    <g opacity="0.22" stroke="${system.grid}" stroke-width="1">
      ${grid}
    </g>
    ${iconGroup({ x: 140, y: 200, size: iconSize })}
    ${renderTextLines({
      x: 520,
      y: titleY,
      lines: titleLines,
      fontSize: titleSize,
      lineHeight: titleLineHeight,
      fill: system.text,
      weight: 700,
      letterSpacing: "-0.02em"
    })}
    ${renderTextLines({
      x: 520,
      y: valueY,
      lines: valueLines,
      fontSize: config.socialValueSize ?? 26,
      lineHeight: config.socialValueLineHeight ?? 32,
      fill: system.muted
    })}
    ${pills}
    <rect x="980" y="460" width="200" height="12" rx="6" fill="${accent}" fill-opacity="0.25"/>
    <rect x="980" y="488" width="160" height="12" rx="6" fill="${accent}" fill-opacity="0.35"/>
  `;
  return svgDoc({ width, height, body });
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

async function renderPng(svgPath, outPath, options = {}) {
  const buffer = await fs.readFile(svgPath);
  let image = sharp(buffer, { density: options.density ?? 144 });
  if (options.width || options.height) {
    image = image.resize(options.width, options.height);
  }
  await image.png({ compressionLevel: 9, quality: 90 }).toFile(outPath);
}

const iconPath = path.join(brandingDir, "icon.svg");
const wordmarkPath = path.join(brandingDir, "wordmark.svg");
const lockupPath = path.join(brandingDir, "lockup.svg");
const heroPath = path.join(brandingDir, "hero.svg");
const socialPath = path.join(brandingDir, "social-card.svg");

await writeSvg(iconPath, iconSvg());
await writeSvg(wordmarkPath, wordmarkSvg());
await writeSvg(lockupPath, lockupSvg());
await writeSvg(heroPath, heroSvg());
await writeSvg(socialPath, socialCardSvg());

await renderPng(iconPath, path.join(brandingDir, "icon-512.png"), { width: 512, height: 512 });
await renderPng(iconPath, path.join(brandingDir, "icon-256.png"), { width: 256, height: 256 });
await renderPng(heroPath, path.join(brandingDir, "hero.png"));
await renderPng(socialPath, path.join(brandingDir, "social-card-1280x640.png"), { width: 1280, height: 640 });

console.log(`Branding assets generated for ${config.name}.`);
