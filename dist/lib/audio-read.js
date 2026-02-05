import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import decode from 'audio-decode';

async function decodeWithFfmpeg(filePath) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audiodiff-'));
  const outPath = path.join(tmpDir, 'decoded.wav');
  try {
    const res = spawnSync('ffmpeg', ['-y', '-i', filePath, '-f', 'wav', outPath], { stdio: 'ignore' });
    if (res.error) {
      throw new Error(`FFmpeg not available: ${res.error.message}`);
    }
    if (res.status !== 0) {
      throw new Error(`FFmpeg decode failed (exit ${res.status})`);
    }
    const bytes = fs.readFileSync(outPath);
    const audio = await decode(bytes);
    const channels = [];
    for (let c = 0; c < audio.numberOfChannels; c++) channels.push(audio.getChannelData(c));
    return { sampleRate: audio.sampleRate, channels };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function readAudio(filePath, opts) {
  const ext = path.extname(filePath).toLowerCase();
  const bytes = fs.readFileSync(filePath);

  if (ext === '.mp3') {
    if (!opts.ffmpeg) {
      throw new Error('MP3 requires FFmpeg. Use WAV/AIFF/FLAC or pass --ffmpeg with FFmpeg installed.');
    }
    return decodeWithFfmpeg(filePath);
  }

  const audio = await decode(bytes);
  const channels = [];
  for (let c = 0; c < audio.numberOfChannels; c++) channels.push(audio.getChannelData(c));

  if (channels.length > 2 && opts.downmix) {
    const l = channels[0];
    const r = channels[1] || channels[0];
    return { sampleRate: audio.sampleRate, channels: [l, r] };
  }

  if (channels.length > 2 && !opts.downmix) console.warn('Warning: >2 channels detected. Consider --downmix');
  return { sampleRate: audio.sampleRate, channels };
}

export { readAudio };
