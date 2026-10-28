import { writeFileSync } from "node:fs";

export interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  /** Bytes PCM crudos (sin header). */
  data: Uint8Array;
  durationSec: number;
}

/** Parsea un WAV RIFF/PCM. No hace resampling. */
export function parseWav(buf: Uint8Array): WavInfo {
  if (buf.length < 44) throw new Error("archivo demasiado corto para ser WAV");
  const dec = new TextDecoder();
  if (dec.decode(buf.subarray(0, 4)) !== "RIFF") throw new Error("no es RIFF");
  if (dec.decode(buf.subarray(8, 12)) !== "WAVE") throw new Error("no es WAVE");

  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let pos = 12;
  let sampleRate = 0;
  let channels = 0;
  let bits = 0;
  let data: Uint8Array | null = null;

  while (pos + 8 <= buf.length) {
    const id = dec.decode(buf.subarray(pos, pos + 4));
    const size = dv.getUint32(pos + 4, true);
    if (id === "fmt ") {
      channels = dv.getUint16(pos + 10, true);
      sampleRate = dv.getUint32(pos + 12, true);
      bits = dv.getUint16(pos + 22, true);
    } else if (id === "data") {
      data = buf.subarray(pos + 8, Math.min(pos + 8 + size, buf.length));
      break;
    }
    pos += 8 + size + (size % 2);
  }
  if (!data) throw new Error("chunk 'data' no encontrado");
  const bytesPerSample = channels * (bits / 8);
  const durationSec = sampleRate > 0 ? data.length / (bytesPerSample * sampleRate) : 0;
  return { sampleRate, channels, bitsPerSample: bits, data, durationSec };
}

export function pcm16ToBase64(data: Uint8Array): string {
  return Buffer.from(data).toString("base64");
}

/** Convierte PCM multicanales a mono promediando (int16 signed, little-endian). */
export function interleaveToMono(data: Uint8Array, channels: number): Uint8Array {
  const out = new Uint8Array((data.length / channels) * 2);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < out.length / 2; i++) {
    let sum = 0;
    for (let ch = 0; ch < channels; ch++) {
      sum += view.getInt16((i * channels + ch) * 2, true);
    }
    outView.setInt16(i * 2, sum / channels, true);
  }
  return out;
}

/** Escribe un WAV PCM16 mono con la frecuencia indicada (formato de la Live API). */
export function writeWavPcm(outPath: string, pcm: Uint8Array, sampleRate: number): void {
  const channels = 1;
  const bits = 16;
  const blockAlign = channels * (bits / 8);
  const byteRate = sampleRate * blockAlign;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  writeFileSync(outPath, Buffer.concat([header, Buffer.from(pcm)]));
}
