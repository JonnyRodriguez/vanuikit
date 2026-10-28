# dictate

Dictado por voz → **Zed** usando la **Gemini Live STT API**. Paquete
independiente dentro de `vanuinode` (no es parte de `gemini-live-bridge`).

Escucha tu micrófono, transcribe con Gemini, y al soltar la voz copia el texto
al portapapeles y lo **pega en el editor de Zed** bajo el cursor. Sin respuestas
en voz: es solo dictado.

## Setup

```bash
cd vanuinode/dictate
cp .env.example .env
# pega GEMINI_API_KEY (https://aistudio.google.com/apikey)
bun install
```

## Uso

```bash
bun run src/cli.ts        # o: bun dictate (si instalás el paquete)
```

**El mismo atajo inicia y detiene (toggle).** El dictado corre en un bucle:
escucha → al soltar la voz pega en Zed → vuelve a escuchar. `Ctrl+C` sale.

Para usarlo como comando de sistema desde cualquier lado:

```bash
cd vanuinode/dictate
bun link      # o: npm link
dictate       # ahora disponible globalmente
```

## 🟣 Integración con Zed (Alt+D)

El dictado está integrado a Zed vía dos archivos de configuración: una
**tarea** (`.zed/tasks.json`) y un **keybinding global** (`~/.config/zed/keymap.json`).

### Cómo se usa

1. Parate en el buffer de Zed donde querés insertar texto.
2. Presioná **Alt+D**: se abre el dictado en el panel inferior de Zed (streaming
   en vivo de lo que vas hablando) y, al soltar la voz, pega el texto en el
   editor bajo el cursor.
3. Volvé a presionar **Alt+D**: detiene el dictado. Un toggle: el mismo atajo
   inicia y detiene, y la pestaña se oculta sola cuando se detiene.

> Requiere: `GEMINI_API_KEY` (en `.env`), micrófono funcional y las herramientas
> del pegado (ver más abajo).

### 1) Tarea de Zed (por proyecto): `vanuinode/.zed/tasks.json`

```json
[
  {
    "label": "Dictar por voz",
    "command": "bun",
    "args": ["run", "src/cli.ts"],
    "cwd": "$ZED_WORKTREE_ROOT/dictate",
    "use_new_terminal": true,
    "allow_concurrent_runs": true,
    "reveal": "no_focus",
    "hide": "on_success"
  }
]
```

Detalle de las claves que importan:

| Clave | Valor | Por qué |
| --- | --- | --- |
| `cwd` | `$ZED_WORKTREE_ROOT/dictate` | corre dentro de este paquete, así Bun encuentra el `.env` y el `src/cli.ts` |
| `use_new_terminal` | `true` | cada invocación usa su propia pestaña (evita colisión de procesos) |
| `allow_concurrent_runs` | `true` | el 2º Alt+D lanza una instancia nueva que mata a la 1ª (toggle) |
| `reveal` | `no_focus` | muestra el streaming en el panel inferior pero NO roba el foco del editor → el pegado cae en el buffer |
| `hide` | `on_success` | oculta la pestaña cuando el proceso sale con exit 0 (detenido) → no quedan ventanas vacías acumuladas |

### 2) Keybinding global: `~/.config/zed/keymap.json`

```json
[
  {
    "context": "Workspace",
    "bindings": {
      "alt-d": ["task::Spawn", { "task_name": "Dictar por voz" }]
    }
  }
]
```

### Cómo aplicarlo / reproducirlo

```bash
# 1) Asegurate de tener la tarea en el proyecto
echo "la tarea ya está en vanuinode/.zed/tasks.json"

# 2) Creá el keymap global (si no existe) con el JSON de arriba:
mkdir -p ~/.config/zed
cat > ~/.config/zed/keymap.json <<'EOF'
[
  {
    "context": "Workspace",
    "bindings": {
      "alt-d": ["task::Spawn", { "task_name": "Dictar por voz" }]
    }
  }
]
EOF

# 3) Reiniciá Zed (recarga tasks.json y keymap.json).
# 4) Verificá que existan las herramientas del pegado:
command -v kdotool ydotool wtype wl-copy notify-send
```

### Dependencias del sistema

| Herramienta | Rol en el dictado |
| --- | --- |
| `kdotool` | enfocar la ventana de Zed antes de pegar |
| `ydotool` (o `wtype`) | inyectar Ctrl+V (pegado) |
| `wl-copy` | copiar el texto al portapapeles de Wayland |
| `notify-send` | notificaciones de escritorio (estado del dictado) |
| `arecord` | capturar el micrófono (PCM16 16kHz) |

## Arquitectura

```
src/
  cli.ts         dictado: toggle por pidfile + clipboard + foco/pegado en Zed
  stt.ts         transcripción en vivo (Gemini Live STT, server-side activity)
  live-client.ts cliente WebSocket mínimo de la Live API (setup/send/parse)
  wav.ts         utilidades WAV PCM16
  types.ts       guards JSON
```

## Notas

- El STT (Gemini Live) usa detección de actividad del **servidor**: llegan
  interim y el cierre (`inputTranscription`) cuando dejás de hablar.
- El modelo de transcripción por defecto es `gemini-3.5-transcribe-live`
  (configurable vía `GEMINI_STT_MODEL`).
- El dictado no genera respuestas en voz ni usa TTS.
