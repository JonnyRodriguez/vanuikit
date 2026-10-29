# asistente

Asistente de voz personal sobre la **Gemini Live API** (WebSocket `BidiGenerateContent`).

Requiere `GEMINI_API_KEY` en `.env` (Bun lo carga automáticamente).

## CLI (consola, modo walkie-talkie)

```bash
bun asist.ts
```

- `arecord` captura el micrófono (16 kHz PCM16) y `aplay` reproduce la respuesta (24 kHz).
- Walkie-talkie: el micrófono se pausa mientras el asistente habla y vuelve cuando
  `aplay` TERMINA de sonar (no al llegar `turnComplete` — la cola del pipe sigue sonando).
- Sin audífonos no hay eco porque el mic está apagado mientras habla él; a cambio
  no puedes interrumpirlo a media frase.

## Web (recomendado)

```bash
bun run web   # build de la SPA + servidor en http://localhost:3210
```

- `server.ts` — un solo `Bun.serve`: SPA estática (`web/`), WebSocket nativo en `/ws`
  y rutas Hono en `/api/*` (convención `vanui/server` con `loadRoutes`, deny-by-default).
- `relay.ts` — una `GeminiSession` por navegador: mic → `realtimeInput.audio`,
  `modelTurn` → audio al navegador, transcripciones, y las toolCalls del lado servidor.
  **La API key vive solo aquí** — el navegador jamás la ve.
- `policy.ts` — normas de seguridad de las herramientas: `allow` (lista blanca de
  solo-lectura), `deny` (patrones prohibidos: `rm -rf`, `sudo`, pipes a shell…) y
  `confirm` (todo lo demás → ConfirmDialog en el navegador; timeout = denegado).
  **Es un stub con la forma correcta, no una frontera de seguridad completa.**
- `web/` — SPA con vanui: `getUserMedia` con `echoCancellation` nativa (conversación
  natural CON interrupciones, sin audífonos), transcripciones en vivo, entrada por
  texto (`clientContent`) y aprobación de comandos con `ConfirmDialog`.

## Herramientas

| Herramienta | Alcance | Política |
| --- | --- | --- |
| `run_shell_command` | shell dentro del proyecto | allowlist → auto; patrones prohibidos → deny; resto → confirmación humana |
| `read_file` | archivos dentro del proyecto (ruta validada) | auto |

Ejemplos: "ejecuta `ls -la`" corre solo; "ejecuta `date`" pide confirmación;
"sudo …" se deniega sin preguntar.

## Notas técnicas (Live API v1beta, verificadas contra la API real)

- `responseModalities` va DENTRO de `generationConfig`; `gemini-3.8-live` solo acepta
  `["AUDIO"]` — el texto llega vía `outputAudioTranscription`/`inputAudioTranscription`.
- El audio del mic va como `realtimeInput.audio {data, mimeType}`; el formato viejo
  `mediaChunks` se descarta en silencio (sin error).
- Los frames binarios del WebSocket en Bun llegan como `ArrayBuffer`: decodificar
  con `TextDecoder`.
