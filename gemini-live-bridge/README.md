# gemini-live-bridge

Sidecar de voz sobre la **Gemini Live API** (WebSocket `BidiGenerateContent`), pensado
para conectar la voz con un arnés de IA local (omp / dsh / zcode).

El arnés sigue siendo el arnés: este proyecto solo escucha tu voz, la envía a Gemini
y entrega el resultado (texto o audio) al arnés.

## Setup

```bash
cp .env.example .env
# pega GEMINI_API_KEY (https://aistudio.google.com/apikey)
bun install
```

## Modelos (verificados en esta cuenta, 2026-10)

| Modelo | Uso |
| --- | --- |
| `models/gemini-3.8-live` | Conversación de voz (audio de respuesta). No devuelve texto/transcripción |
| `models/gemini-3.5-transcribe-live` | STT en streaming (`responseModalities: ["TEXT"]`) |

Los ids con sufijo `-preview` / `-native-audio-dialog` NO existen en esta cuenta.
El audio se cobra por tiempo/tokens — verificá tu cuota antes de usarlo en producción.

## Uso (un solo punto de entrada: `src/cli.ts`)

```bash
# Transcribir un WAV (16 kHz PCM16 mono) → texto
bun run src/cli.ts transcribe clip16k.wav

# Grabar N segundos a un WAV (captura fija, default 6s)
bun run src/cli.ts record clip.wav 6

# Bucle de conversación completo: voz → omp → voz
bun run src/cli.ts chat

# Un solo turno desde un WAV (prueba sin micrófono)
bun run src/cli.ts chat clip16k.wav

# Dictado por voz → Zed (sin respuestas en voz):
#   escucha, copia a portapapeles y pega solo sobre la ventana de Zed
# (vía kdotool para enfocar + ydotool/wtype para Ctrl+V).
bun run src/cli.ts dictate
```

## Cómo se arma el loop (`chat`)

```
[tu voz] → arecord (PCM16 16kHz) → Gemini Live STT (actividad del SERVIDOR)
                                              ↓ inputTranscription final
                                     texto → omp -p → respuesta
                                              ↓ sanitización markdown
                                     Gemini Live TTS → aplay (PCM 24kHz) → 🔊
```

- La **transcripción** usa detección de actividad del servidor (sin VAD local): llegan
  interim y el cierre (`inputTranscription`) cuando dejás de hablar.
- La **respuesta** se streamea a `aplay -r 24000` y se espera su duración antes de
  volver a escuchar (anti-eco). El modelo de síntesis a veces tarda en arrancar o
  devuelve audio vacío: esperamos el `turnComplete` del servidor (sin cerrar antes de
  tiempo), validamos cada bloque y reintentamos hasta 3 veces.

## Arquitectura

```
src/
  live-client.ts   cliente WebSocket mínimo de la Live API (setup/send/parse)
  stt.ts           transcripción: transcribeFile (WAV) + listenAndTranscribe (en vivo)
  tts.ts           síntesis: textToAudioFile + speakText (streaming a aplay)
  wav.ts           parsear/escribir WAV PCM16, interleave a mono
  cli.ts           punto de entrada único (transcribe | chat | record | dictate)
  types.ts         guards JSON
```
