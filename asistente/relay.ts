/**
 * relay — Sesión Gemini por cada navegador conectado.
 *
 * El navegador es boca y oídos (mic → realtimeInput, audio ← modelTurn); este
 * proceso son las manos: ejecuta las toolCalls que pide el modelo, SIEMPRE
 * pasando por policy.ts. Las toolCalls que piden confirmación se elevan al
 * navegador (ConfirmDialog) y el modelo espera su toolResponse mientras tanto.
 *
 * Formatos de cable verificados contra la Live API v1beta (2026-10):
 *  - responseModalities va DENTRO de generationConfig; gemini-3.8-live solo
 *    acepta ["AUDIO"] (el texto llega vía output/inputAudioTranscription).
 *  - Audio del mic: realtimeInput.audio {data, mimeType} — el formato viejo
 *    mediaChunks se descarta en silencio.
 */

import { resolve as resolvePath } from "node:path";

import { isPathInside, reviewToolCall } from "./policy";

const MODEL = "models/gemini-3.8-live";
const MAX_FILE_CHARS = 200_000;
const CONFIRM_TIMEOUT_MS = 120_000;

export interface RelayOptions {
    apiKey: string;
    projectRoot: string;
    /** Envía un mensaje JSON al navegador. */
    toBrowser: (msg: Record<string, unknown>) => void;
    /** El navegador se fue: aborta todo. */
    onBrowserGone: () => void;
}

type BrowserMsg =
    | { type: "audio"; data: string }
    | { type: "text"; text: string }
    | { type: "confirm-response"; id: string; approved: boolean }
    | { type: "stop" };

interface PendingConfirm {
    resolve: (approved: boolean) => void;
    timer: ReturnType<typeof setTimeout>;
}

export class GeminiSession {
    private gemini: WebSocket;
    private decoder = new TextDecoder();
    private pendingConfirms = new Map<string, PendingConfirm>();
    private closed = false;
    private child: ReturnType<typeof Bun.spawn> | null = null;

    constructor(private opts: RelayOptions) {
        this.gemini = new WebSocket(
            `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.opts.apiKey}`,
        );
        this.gemini.binaryType = "arraybuffer";
        this.gemini.onopen = () => this.sendSetup();
        this.gemini.onmessage = (ev) => this.onGeminiMessage(ev);
        this.gemini.onclose = (ev) => {
            if (this.closed) return;
            this.opts.toBrowser({
                type: "error",
                message: `Gemini cerró la conexión (${ev.code})${ev.reason ? `: ${ev.reason}` : ""}`,
            });
            this.close();
        };
        this.gemini.onerror = () => {
            if (this.closed) return;
            this.opts.toBrowser({ type: "error", message: "Error de conexión con Gemini" });
            this.close();
        };
    }

    /** Mensajes del navegador. */
    handleBrowserMessage(raw: string | ArrayBuffer): void {
        let msg: BrowserMsg;
        try {
            msg = JSON.parse(typeof raw === "string" ? raw : this.decoder.decode(raw));
        } catch {
            return;
        }
        if (this.closed) return;
        if (msg.type === "audio") {
            // El mic empieza a emitir en cuanto el navegador lo abre, pero la
            // conexión hacia Gemini tarda ~0.5 s en estar OPEN: soltar esos
            // primeros trozos (silencio) en vez de send() sobre CONNECTING.
            if (this.gemini.readyState !== WebSocket.OPEN) return;
            try {
                this.gemini.send(
                    JSON.stringify({
                        realtimeInput: { audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" } },
                    }),
                );
            } catch {
                /* carrera de cierre: el siguiente trozo ya no pasará la guarda */
            }
        } else if (msg.type === "text") {
            // Entrada por teclado: turno de texto → el modelo responde hablando
            this.send({
                clientContent: {
                    turns: [{ role: "user", parts: [{ text: msg.text }] }],
                    turnComplete: true,
                },
            });
        } else if (msg.type === "confirm-response") {
            const pending = this.pendingConfirms.get(msg.id);
            if (pending) {
                clearTimeout(pending.timer);
                this.pendingConfirms.delete(msg.id);
                pending.resolve(msg.approved);
            }
        } else if (msg.type === "stop") {
            this.close();
        }
    }

    close(): void {
        if (this.closed) return;
        this.closed = true;
        for (const [, pending] of this.pendingConfirms) {
            clearTimeout(pending.timer);
            pending.resolve(false);
        }
        this.pendingConfirms.clear();
        this.child?.kill();
        try {
            this.gemini.close();
        } catch {
            /* ya cerrado */
        }
        this.opts.onBrowserGone();
    }

    private sendSetup(): void {
        this.gemini.send(
            JSON.stringify({
                setup: {
                    model: MODEL,
                    generationConfig: { responseModalities: ["AUDIO"] },
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    systemInstruction: {
                        parts: [
                            {
                                text: "Eres 'Asistente', un asistente de desarrollo por voz que corre en la máquina local del usuario (Manjaro Linux + Bun). Tienes manos: run_shell_command y read_file; úsalas para actuar, no solo conversar. Tu salida es HABLADA: responde breve (2-4 frases), sin listas ni markdown. Los comandos peligrosos requieren aprobación humana en la interfaz: si el usuario niega, acepta la negación y propón una alternativa; nunca insistas.",
                            },
                        ],
                    },
                    tools: [
                        {
                            functionDeclarations: [
                                {
                                    name: "run_shell_command",
                                    description:
                                        "Ejecuta un comando de shell en Linux (Manjaro) dentro del proyecto y devuelve la salida.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            command: { type: "STRING", description: "El comando de bash a ejecutar." },
                                        },
                                        required: ["command"],
                                    },
                                },
                                {
                                    name: "read_file",
                                    description: "Lee un archivo de texto dentro del proyecto.",
                                    parameters: {
                                        type: "OBJECT",
                                        properties: {
                                            path: { type: "STRING", description: "Ruta al archivo (relativa al proyecto)." },
                                        },
                                        required: ["path"],
                                    },
                                },
                            ],
                        },
                    ],
                },
            }),
        );
    }

    private send(obj: object): void {
        if (!this.closed && this.gemini.readyState === WebSocket.OPEN) {
            this.gemini.send(JSON.stringify(obj));
        }
    }

    private onGeminiMessage(ev: { data: string | ArrayBuffer }): void {
        let msg: any;
        try {
            msg = JSON.parse(
                typeof ev.data === "string" ? ev.data : this.decoder.decode(ev.data as ArrayBuffer),
            );
        } catch {
            return;
        }

        if (msg.setupComplete) {
            this.opts.toBrowser({ type: "ready" });
            return;
        }

        const sc = msg.serverContent ?? {};
        if (sc.interrupted) this.opts.toBrowser({ type: "interrupted" });
        if (sc.inputTranscription?.text) {
            this.opts.toBrowser({ type: "user-text", text: sc.inputTranscription.text });
        }
        if (sc.outputTranscription?.text) {
            this.opts.toBrowser({ type: "assistant-text", text: sc.outputTranscription.text });
        }
        for (const part of sc.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) this.opts.toBrowser({ type: "audio", data: part.inlineData.data });
        }
        if (sc.turnComplete) this.opts.toBrowser({ type: "turn-complete" });

        if (msg.toolCall) {
            void this.runToolCalls(msg.toolCall.functionCalls ?? []);
        }
    }

    private async runToolCalls(calls: Array<{ id: string; name: string; args?: Record<string, unknown> }>): Promise<void> {
        for (const call of calls) {
            const { id, name } = call;
            const args = call.args ?? {};
            this.opts.toBrowser({ type: "tool", phase: "requested", name, args });

            const decision = reviewToolCall(name, args);
            const approved =
                decision.action === "allow"
                    ? true
                    : decision.action === "deny"
                      ? false
                      : await this.askHuman(id, name, args);

            if (!approved) {
                const reason =
                    decision.action === "deny"
                        ? decision.reason
                        : "denegado por el usuario";
                this.opts.toBrowser({ type: "tool", phase: "denied", name, args, output: reason });
                this.respond(id, name, { error: `Denegado por la política de seguridad: ${reason}` });
                continue;
            }

            this.opts.toBrowser({ type: "tool", phase: "running", name, args });
            const output = await this.execute(name, args);
            this.opts.toBrowser({ type: "tool", phase: "done", name, args, output });
            this.respond(id, name, { output });
        }
    }

    /** Eleva la confirmación al navegador; resuelve false en timeout o salida. */
    private askHuman(id: string, name: string, args: Record<string, unknown>): Promise<boolean> {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pendingConfirms.delete(id);
                resolve(false);
            }, CONFIRM_TIMEOUT_MS);
            this.pendingConfirms.set(id, { resolve, timer });
            this.opts.toBrowser({ type: "confirm-request", id, name, args });
        });
    }

    private respond(id: string, name: string, response: Record<string, unknown>): void {
        this.send({
            toolResponse: { functionResponses: [{ id, name, response }] },
        });
    }

    private async execute(name: string, args: Record<string, unknown>): Promise<string> {
        try {
            if (name === "run_shell_command") {
                const proc = Bun.spawn(["sh", "-c", String(args.command ?? "")], {
                    cwd: this.opts.projectRoot,
                    stdout: "pipe",
                    stderr: "pipe",
                });
                this.child = proc;
                const [stdout, stderr, exitCode] = await Promise.all([
                    new Response(proc.stdout).text(),
                    new Response(proc.stderr).text(),
                    proc.exited,
                ]);
                this.child = null;
                let out = `$ exit ${exitCode}\n${stdout}`.trim();
                if (stderr.trim()) out += `\n[stderr] ${stderr.trim()}`;
                return out.slice(0, MAX_FILE_CHARS) || "(sin salida)";
            }
            if (name === "read_file") {
                const raw = String(args.path ?? "");
                if (!isPathInside(this.opts.projectRoot, raw)) {
                    return "DENEGADO: la ruta queda fuera del proyecto.";
                }
                const file = Bun.file(resolvePath(this.opts.projectRoot, raw));
                const text = await file.text();
                return text.length > MAX_FILE_CHARS
                    ? text.slice(0, MAX_FILE_CHARS) + "\n…(truncado)"
                    : text;
            }
            return `Herramienta desconocida: ${name}`;
        } catch (error) {
            return `Error al ejecutar la acción: ${(error as Error).message}`;
        }
    }
}
