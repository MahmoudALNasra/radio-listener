/** Float32 mono PCM ring + WAV encoder for browser clips. */

export class PcmRing {
  private readonly maxSamples: number;
  private readonly chunks: Float32Array[] = [];
  private samples = 0;

  constructor(
    readonly sampleRate: number,
    seconds: number
  ) {
    this.maxSamples = Math.floor(sampleRate * seconds);
  }

  write(input: Float32Array) {
    if (!input.length) return;
    this.chunks.push(new Float32Array(input));
    this.samples += input.length;
    while (this.samples > this.maxSamples && this.chunks.length) {
      const old = this.chunks.shift()!;
      this.samples -= old.length;
    }
  }

  snapshotSeconds(seconds: number): Float32Array {
    const need = Math.floor(this.sampleRate * seconds);
    if (this.samples <= need) {
      return concatFloat32(this.chunks);
    }
    const keep: Float32Array[] = [];
    let counted = 0;
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      keep.push(this.chunks[i]);
      counted += this.chunks[i].length;
      if (counted >= need) break;
    }
    keep.reverse();
    const all = concatFloat32(keep);
    return all.length > need ? all.subarray(all.length - need) : all;
  }
}

function concatFloat32(parts: Float32Array[]): Float32Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Float32Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

export function floatTo16BitPCM(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export function encodeWav(float32: Float32Array, sampleRate: number): Blob {
  const pcm = floatTo16BitPCM(float32);
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, pcm.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++, offset += 2) {
    view.setInt16(offset, pcm[i], true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function matchKeyword(text: string, keywords: string[]): string | null {
  const normalized = text.toLowerCase();
  for (const kw of keywords) {
    const k = kw.trim().toLowerCase();
    if (!k) continue;
    const re = new RegExp(`(^|[^a-z0-9])${escapeReg(k)}([^a-z0-9]|$)`, "i");
    if (re.test(normalized)) return k;
  }
  return null;
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
