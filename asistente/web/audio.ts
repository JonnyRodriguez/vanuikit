/**
 * Captura de micrófono y reproducción PCM para el asistente web.
 *
 * getUserMedia trae cancelación de eco nativa (echoCancellation): el navegador
 * le resta al micrófono lo que sale por los parlantes → conversación full-duplex
 * con interrupciones, sin audífonos.
 */

// ---- Micrófono: Float32 → PCM16 mono 16 kHz base64 ----

export async function startMic(onChunk: (base64Pcm: string) => void): Promise<() => void> {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    // Pedimos el contexto a 16 kHz: el navegador remuestrea, sin DSP manual
    const ctx = new AudioContext({ sampleRate: 16000 });
    await ctx.audioWorklet.addModule(captureWorkletUrl());
    const worklet = new AudioWorkletNode(ctx, "pcm-capture");
    worklet.port.onmessage = (e: MessageEvent<Float32Array>) => {
        const f32 = e.data;
        const pcm = new Int16Array(f32.length);
        for (let i = 0; i < f32.length; i++) {
            const s = Math.max(-1, Math.min(1, f32[i] ?? 0));
            pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        onChunk(int16ToBase64(pcm));
    };
    ctx.createMediaStreamSource(stream).connect(worklet);
    // El worklet no suena: no se conecta a destination

    return () => {
        worklet.port.onmessage = null;
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
    };
}

function captureWorkletUrl(): string {
    const src = `
    class PcmCapture extends AudioWorkletProcessor {
      constructor() { super(); this.buf = new Float32Array(4096); this.n = 0; }
      process(inputs) {
        const ch = inputs[0] && inputs[0][0];
        if (ch) {
          for (let i = 0; i < ch.length; i++) {
            this.buf[this.n++] = ch[i];
            if (this.n === this.buf.length) { this.port.postMessage(this.buf.slice(0)); this.n = 0; }
          }
        }
        return true;
      }
    }
    registerProcessor("pcm-capture", PcmCapture);
  `;
    return URL.createObjectURL(new Blob([src], { type: "application/javascript" }));
}

function int16ToBase64(pcm: Int16Array): string {
    const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    let bin = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
}

// ---- Reproducción: PCM16 mono 24 kHz base64 → cola de AudioBuffers ----

export class PcmPlayer {
    private ctx = new AudioContext({ sampleRate: 24000 });
    private gain: GainNode;
    private nextTime = 0;
    private activeSources = new Set<AudioBufferSourceNode>();

    constructor(initialVolume = 1) {
        // La voz pasa por un nodo de ganancia: el volumen cambia EN VIVO,
        // incluso sobre el audio ya programado
        this.gain = this.ctx.createGain();
        this.gain.gain.value = initialVolume;
        this.gain.connect(this.ctx.destination);
    }

    /** Volumen 0..1; setTargetAtTime evita el "click" al mover el control. */
    setVolume(v: number): void {
        this.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this.ctx.currentTime, 0.02);
    }

    /** Llamar tras un gesto del usuario (requisito del navegador). */
    resume(): void {
        if (this.ctx.state === "suspended") void this.ctx.resume();
    }

    queue(base64: string): void {
        const pcm = base64ToInt16(base64);
        if (pcm.length === 0) return;
        const buf = this.ctx.createBuffer(1, pcm.length, 24000);
        const channel = buf.getChannelData(0);
        for (let i = 0; i < pcm.length; i++) channel[i] = (pcm[i] ?? 0) / 0x8000;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this.gain);
        this.activeSources.add(src);
        src.onended = () => this.activeSources.delete(src);
        const now = this.ctx.currentTime;
        if (this.nextTime < now + 0.03) this.nextTime = now + 0.03;
        src.start(this.nextTime);
        this.nextTime += buf.duration;
    }

    /** Interrupción: frena en seco lo que suena y lo programado, y resetea el reloj. */
    stopAll(): void {
        for (const src of this.activeSources) {
            try {
                src.stop();
            } catch {
                /* ya detenido */
            }
        }
        this.activeSources.clear();
        this.nextTime = this.ctx.currentTime;
    }

    /** ¿Queda audio programado por sonar? */
    get busy(): boolean {
        return this.nextTime > this.ctx.currentTime + 0.05;
    }

    close(): void {
        this.stopAll();
        void this.ctx.close();
    }
}

function base64ToInt16(base64: string): Int16Array {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const even = bytes.byteLength - (bytes.byteLength % 2);
    const aligned = new Uint8Array(bytes.buffer, 0, even);
    return new Int16Array(aligned.buffer, aligned.byteOffset, even / 2);
}
