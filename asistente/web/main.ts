/**
 * Asistente web — SPA vanui.
 *
 * El navegador es boca y oídos: getUserMedia (con cancelación de eco nativa)
 * → /ws → relay.ts. Las transcripciones y toolCalls se pintan aquí; la
 * aprobación de comandos llega como confirm-request → ConfirmDialog.
 */

import {
    van,
    t,
    raw,
    Badge,
    Button,
    Card,
    createTheme,
    PrimaryButton,
    SecondaryButton,
    TextField,
    ThemeToggle,
    toast,
    confirmDialog,
} from "vanui";

import { PcmPlayer, startMic } from "./audio";

const { div, h1, header, input, p, span, pre } = van.tags;

// Activa las variables de tema en <html> (claro/oscuro/sistema)
const theme = createTheme({ defaultMode: "system", storageKey: "asistente-theme" });

type ConnStatus = "off" | "connecting" | "live";

const status = van.state<ConnStatus>("off");
const speaking = van.state(false);

let ws: WebSocket | null = null;
let stopMic: (() => void) | null = null;
let player: PcmPlayer | null = null;

// ---- Transcripción (append-only, DOM directo: los nodos no viven en states) ----

const chatEl = div({ class: "chat" });

function appendMsg(kind: "user" | "assistant" | "tool" | "system", text: string): void {
    const labels = {
        user: `🎤 ${raw("asistente.you", "Tú")}`,
        assistant: `🔊 ${raw("asistente.assistant", "Asistente")}`,
        tool: `🛠 ${raw("asistente.tool", "Herramienta")}`,
    } as const;
    if (kind === "system") {
        chatEl.appendChild(div({ class: "msg system" }, span(text)));
    } else {
        chatEl.appendChild(
            div(
                { class: `msg ${kind}` },
                span({ class: "who" }, labels[kind]),
                kind === "tool" ? pre({ class: "tool-out" }, text) : span({ class: "text" }, text),
            ),
        );
    }
    chatEl.scrollTop = chatEl.scrollHeight;
}

// ---- Control de volumen (persistente; aplica a la voz en vivo) ----

const VOLUME_KEY = "asistente-volume";

function readVolume(): number {
    const saved = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 1;
}

function onVolumeInput(e: Event): void {
    const v = Number((e.target as HTMLInputElement).value) / 100;
    localStorage.setItem(VOLUME_KEY, String(v));
    player?.setVolume(v);
}

// ---- Entrada por teclado (clientContent: el modelo responde hablando) ----

const textInput = TextField({
    label: t("asistente.textPrompt", "Escríbele algo"),
    name: "prompt",
    placeholder: t("asistente.textPlaceholder", "También puedes escribir en vez de hablar"),
    required: false,
});

function sendText(): void {
    const text = textInput.value.val.trim();
    if (!text || status.val !== "live" || !ws) return;
    textInput.value.val = "";
    appendMsg("user", text);
    ws.send(JSON.stringify({ type: "text", text }));
}

// ---- Conexión ----

async function connect(): Promise<void> {
    if (status.val !== "off") return;
    status.val = "connecting";
    try {
        player = new PcmPlayer(readVolume());
        player.resume(); // estamos en un click: el AudioContext puede arrancar

        ws = new WebSocket(`ws://${location.host}/ws`);

        ws.onmessage = (ev) => void handleServerMessage(JSON.parse(ev.data as string));
        ws.onclose = () => void teardown();
        ws.onerror = () => toast.error(raw("asistente.wsError", "No se pudo conectar con el servidor"));

        stopMic = await startMic((b64) => {
            if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "audio", data: b64 }));
        });
    } catch (error) {
        toast.error(raw("asistente.micError", "No se pudo abrir el micrófono"));
        console.error(error);
        await teardown();
    }
}

async function handleServerMessage(msg: Record<string, any>): Promise<void> {
    switch (msg.type) {
        case "ready":
            status.val = "live";
            appendMsg("system", raw("asistente.connected", "Conectado — te escucho"));
            toast.success(raw("asistente.connectedToast", "Asistente conectado"));
            break;
        case "user-text":
            appendMsg("user", msg.text);
            break;
        case "assistant-text":
            appendMsg("assistant", msg.text);
            break;
        case "audio":
            player?.queue(msg.data);
            break;
        case "turn-complete":
            break;
        case "interrupted":
            appendMsg("system", raw("asistente.interrupted", "…interrumpido"));
            break;
        case "tool":
            if (msg.phase === "running") appendMsg("tool", `$ ${msg.args?.command ?? msg.args?.path ?? ""}`);
            if (msg.phase === "done") {
                const out = String(msg.output ?? "").slice(0, 400);
                appendMsg("tool", out || "(sin salida)");
            }
            if (msg.phase === "denied") {
                appendMsg("system", `⛔ ${raw("asistente.denied", "Denegado por la política")}: ${msg.output ?? ""}`);
                toast.error(raw("asistente.deniedToast", "El asistente pidió algo prohibido"));
            }
            break;
        case "confirm-request":
            await askApproval(msg as { id: string; name: string; args: Record<string, unknown> });
            break;
        case "error":
            toast.error(String(msg.message ?? "Error"));
            appendMsg("system", `⚠️ ${msg.message ?? ""}`);
            await teardown();
            break;
    }
}

/** ConfirmDialog de vanui sobre el toolCall peligroso; responde al relay. */
async function askApproval(msg: { id: string; name: string; args: Record<string, unknown> }): Promise<void> {
    const detail =
        msg.name === "run_shell_command"
            ? String(msg.args.command ?? "")
            : JSON.stringify(msg.args, null, 2);
    const approved = await confirmDialog({
        title: raw("asistente.approveTitle", "Aprobar acción"),
        message: detail,
        variant: "danger",
        confirmText: raw("asistente.approve", "Permitir"),
        cancelText: raw("asistente.deny", "Denegar"),
    });
    ws?.send(JSON.stringify({ type: "confirm-response", id: msg.id, approved }));
    if (!approved) toast.info(raw("asistente.deniedYou", "Acción denegada"));
}

async function teardown(): Promise<void> {
    stopMic?.();
    stopMic = null;
    player?.close();
    player = null;
    if (ws) {
        const sock = ws;
        ws = null;
        sock.onclose = null;
        sock.close();
    }
    status.val = "off";
    speaking.val = false;
}

// ---- UI ----

const statusLabels = {
    off: () => t("asistente.status.off", "Desconectado"),
    connecting: () => t("asistente.status.connecting", "Conectando…"),
    live: () => t("asistente.status.live", "En vivo"),
} as const;

function controls() {
    if (status.val === "off") {
        return PrimaryButton({ onclick: () => void connect() }, t("asistente.connect", "Conectar voz"));
    }
    return div(
        { class: "row gap" },
        status.val === "connecting" && span({ class: "pulse", "aria-label": "…" }),
        SecondaryButton({ onclick: () => ws?.send(JSON.stringify({ type: "stop" })), disabled: status.val !== "live" }, t("asistente.hangup", "Colgar")),
        Button({ variant: "destructive", onclick: () => void teardown() }, t("asistente.disconnect", "Desconectar")),
    );
}

van.add(
    document.getElementById("app")!,
    div(
        { class: "app" },
        header(
            { class: "app-header" },
            h1(t("asistente.title", "Asistente de voz")),
            div(
                { class: "row gap" },
                // vanui aún no tiene Slider: input range nativo con a11y
                span(
                    { "aria-hidden": "true" },
                    "🔊",
                ),
                input({
                    type: "range",
                    min: 0,
                    max: 100,
                    value: Math.round(readVolume() * 100),
                    "aria-label": t("asistente.volume", "Volumen de la voz del asistente"),
                    oninput: onVolumeInput,
                }),
                ThemeToggle({ theme, variant: "button" }),
            ),
        ),
        div(
            { class: "row status-row" },
            () => {
                const s = status.val;
                return Badge({
                    text: statusLabels[s](),
                    variant: s === "live" ? "success" : s === "connecting" ? "warning" : "secondary",
                    dot: true,
                });
            },
            // Renderizado permanente + clase reactiva: un function-child que
            // devuelve false pintaría el literal "false" (gotcha de van)
            span(
                { class: () => (speaking.val ? "speaking" : "speaking hidden") },
                t("asistente.speaking", "🔊 hablando…"),
            ),
            div({ class: "controls" }, () => controls()),
        ),
        Card(
            { class: "chat-card" },
            chatEl,
            div(
                { class: "text-row" },
                textInput.dom(),
                // function-child que SIEMPRE devuelve el botón (reconstrucción
                // segura por cambio de status; devolver false/null pintaría
                // "false" o congelaría el binding — gotchas de van)
                () =>
                    PrimaryButton(
                        { class: status.val === "live" ? "" : "hidden", onclick: sendText },
                        t("asistente.send", "Enviar"),
                    ),
            ),
        ),
    ),
);

// Indicador de "hablando": el player sabe si queda audio programado
setInterval(() => {
    if (player) speaking.val = player.busy;
}, 150);
