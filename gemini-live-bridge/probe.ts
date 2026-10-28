import { GeminiLiveClient } from "./src/live-client";
import { parseWav, pcm16ToBase64 } from "./src/wav";

const KEY = process.env.GEMINI_API_KEY!;
const b = new Uint8Array(await Bun.file("clip16k.wav").arrayBuffer());
const wav = parseWav(b);
const pcm = wav.data;

const events: string[] = [];
const client = new GeminiLiveClient(
  { apiKey: KEY, model: "models/gemini-3.5-transcribe-live", generationConfig: { responseModalities: ["TEXT"] } },
  {
    onServerContent: (e) => events.push(`content text=${JSON.stringify(e.text)} transcription=${JSON.stringify(e.transcription)} isFinal=${e.isFinal}`),
    onSetupComplete: () => events.push("setupComplete"),
    onTurnComplete: () => events.push("turnComplete"),
  },
);

try {
  await client.connect();
  events.push("connected");
  const CHUNK = 16384;
  for (let i = 0; i < pcm.length; i += CHUNK) {
    client.sendRealtimeAudio(pcm16ToBase64(pcm.subarray(i, i + CHUNK)));
    await Bun.sleep(20);
  }
  client.endAudioStream();
  await Bun.sleep(25000);
} finally {
  client.close();
}
console.log(events.join("\n"));
