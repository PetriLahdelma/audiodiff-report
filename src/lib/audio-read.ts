import fs from 'node:fs';
import path from 'node:path';
import decode from 'audio-decode';
import { AudioBufferLike } from './types.js';

async function decodeWithFfmpeg(filePath: string): Promise<AudioBufferLike> {
  throw new Error(`FFmpeg decode requested but not implemented in pure Node mode: ${filePath}`);
}

export async function readAudio(filePath: string, opts: { downmix: boolean; ffmpeg: boolean }): Promise<AudioBufferLike> {
  const ext = path.extname(filePath).toLowerCase();
  const bytes = fs.readFileSync(filePath);

  if (ext === '.mp3') {
    if (!opts.ffmpeg) {
      throw new Error('MP3 requires FFmpeg. Use WAV/AIFF/FLAC or pass --ffmpeg with FFmpeg installed.');
    }
    return decodeWithFfmpeg(filePath);
  }

  const audio = await decode(bytes);
  const channels: Float32Array[] = [];
  for (let c = 0; c < audio.numberOfChannels; c++) channels.push(audio.getChannelData(c));

  if (channels.length > 2 && opts.downmix) {
    const l = channels[0];
    const r = channels[1] || channels[0];
    return { sampleRate: audio.sampleRate, channels: [l, r] };
  }

  if (channels.length > 2 && !opts.downmix) console.warn('Warning: >2 channels detected. Consider --downmix');
  return { sampleRate: audio.sampleRate, channels };
}
