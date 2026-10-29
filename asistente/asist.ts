import { spawn, type ChildProcess } from "child_process";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ Error: La variable de entorno GEMINI_API_KEY no está definida.");
    console.error("Ejecuta tu script exportando la llave: GEMINI_API_KEY='tu_clave' bun run asistente.ts");
    process.exit(1);
}

// URL de la Live API para el modelo multimodal en tiempo real
const URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

console.log("🔌 Conectando con Gemini 3.8 Live...");
const ws = new WebSocket(URL);

// Modo walkie-talkie: mientras el asistente habla, el micrófono queda en pausa
// para que el altavoz nunca alimente al micrófono (sin audífonos no hay eco).
// El mic vuelve cuando aplay TERMINA de sonar (el proceso sale al llegar EOF
// al final del turno), no apenas llega turnComplete — la cola del pipe puede
// seguir sonando varios segundos después.
let micOn = false; // envía audio del micrófono al WebSocket solo en true
let turnDone = false; // ya llegó turnComplete del turno actual
let currentAplay: ChildProcess | null = null;

function startPlayback(): ChildProcess {
    // -q: sin banner "Playing raw data..."; --buffer-time: 0.5 s de colchón
    // para absorber las ráfagas del streaming (si no, aplay sufre underruns)
    const proc = spawn("aplay", [
        "-q",
        "--buffer-time=500000",
        "-t",
        "raw",
        "-f",
        "S16_LE",
        "-r",
        "24000",
        "-c",
        "1",
    ]);
    proc.stderr?.on("data", (d) => process.stderr.write(d));
    proc.on("close", () => {
        if (currentAplay === proc) {
            currentAplay = null;
            maybeListen();
        }
    });
    currentAplay = proc;
    return proc;
}

function maybeListen() {
    if (turnDone && currentAplay === null && !micOn) {
        micOn = true;
        console.log("\n🎙️  Te escucho...");
    }
}

// 1. Evento de conexión abierta
ws.onopen = () => {
    console.log("🎙️  ¡Conectado! El asistente está escuchando y listo para actuar.");

    // Enviar configuración inicial (Setup + Herramientas / Function Calling)
    ws.send(
        JSON.stringify({
            setup: {
                model: "models/gemini-3.8-live",
                // v1beta: las modalidades viven dentro de generationConfig, y este
                // modelo solo acepta ["AUDIO"] (el texto llega vía transcripciones)
                generationConfig: { responseModalities: ["AUDIO"] },
                outputAudioTranscription: {},
                inputAudioTranscription: {},
                systemInstruction: {
                    parts: [
                        {
                            text: "Eres 'Asistente', un asistente de desarrollo por voz que corre en la máquina local del usuario (Manjaro Linux + Bun), en la carpeta desde donde lo lanzan; tu propio código es asist.ts. Tienes manos: run_shell_command y read_file. Úsalas para actuar, no solo conversar. Tu salida es HABLADA: responde breve (2-4 frases), sin listas ni markdown; si hay mucho texto que revisar, usa las herramientas y resume el resultado en voz alta.",
                        },
                    ],
                },
                tools: [
                    {
                        functionDeclarations: [
                            {
                                name: "run_shell_command",
                                description: "Ejecuta un comando de shell en Linux (Manjaro) y devuelve la salida.",
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
                                description: "Lee el contenido de un archivo de texto en el proyecto.",
                                parameters: {
                                    type: "OBJECT",
                                    properties: {
                                        path: { type: "STRING", description: "Ruta al archivo." },
                                    },
                                    required: ["path"],
                                },
                            },
                        ],
                    },
                ],
            },
        })
    );

    // 2. Iniciar captura del micrófono en tiempo real (ALSA arecord a 16kHz PCM)
    const arecord = spawn("arecord", ["-f", "S16_LE", "-r", "16000", "-c", "1", "-t", "raw"]);

    arecord.stdout.on("data", (chunk: Buffer) => {
        if (micOn && ws.readyState === WebSocket.OPEN) {
            // Formato actual de la Live API: realtimeInput.audio.
            // El formato viejo (mediaChunks) el servidor lo ignora en silencio.
            ws.send(
                JSON.stringify({
                    realtimeInput: {
                        audio: {
                            data: chunk.toString("base64"),
                            mimeType: "audio/pcm;rate=16000",
                        },
                    },
                })
            );
        }
    });

    arecord.on("close", (code) => {
        if (code !== null && code !== 0) {
            console.error(`\n⚠️ arecord terminó con código ${code}: el micrófono dejó de enviar.`);
        }
    });

    // Limpieza al salir con Ctrl+C
    process.on("SIGINT", () => {
        console.log("\n👋 Cerrando asistente...");
        arecord.kill();
        currentAplay?.kill();
        ws.close();
        process.exit(0);
    });
};

// 3. Recepción de mensajes (Texto, Audio y Function Calling)
// En Bun los frames del WebSocket llegan como ArrayBuffer (no Blob), que no
// tiene .text(): se decodifica con TextDecoder
const decoder = new TextDecoder();
ws.onmessage = async (event) => {
    const dataText = typeof event.data === "string" ? event.data : decoder.decode(event.data);
    const response = JSON.parse(dataText);

    if (response.setupComplete) {
        turnDone = true;
        maybeListen();
    }

    // A. Si el modelo pide ejecutar una herramienta (Function Calling / "Manos")
    if (response.toolCall) {
        for (const call of response.toolCall.functionCalls) {
            const { name, args, id } = call;
            console.log(`\n🛠️ [Ejecutando herramienta]: ${name}`, args);

            let resultText = "";
            try {
                if (name === "run_shell_command") {
                    const proc = Bun.spawn(["sh", "-c", args.command]);
                    resultText = await new Response(proc.stdout).text();
                    const stderr = await new Response(proc.stderr).text();
                    if (stderr) resultText += `\nStderr: ${stderr}`;
                } else if (name === "read_file") {
                    const file = Bun.file(args.path);
                    resultText = await file.text();
                }
            } catch (error: any) {
                resultText = `Error al ejecutar la acción: ${error.message}`;
            }

            // Regresar el resultado de la herramienta al modelo por el WebSocket
            ws.send(
                JSON.stringify({
                    toolResponse: {
                        functionResponses: [
                            {
                                response: { output: resultText },
                                id: id,
                            },
                        ],
                    },
                })
            );
        }
    }

    // B. Manejo de la respuesta del modelo (Texto en consola + Audio por altavoz)
    const parts = response.serverContent?.modelTurn?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.text) {
                process.stdout.write(part.text);
            }
            if (part.inlineData && part.inlineData.data) {
                const audioBuffer = Buffer.from(part.inlineData.data, "base64");
                if (audioBuffer.length > 0) {
                    if (micOn) {
                        // Empezó a hablar: pausa el micrófono hasta que termine de sonar
                        micOn = false;
                        turnDone = false;
                        console.log("\n🔊 Hablando (mic en pausa)...");
                    }
                    const proc = currentAplay ?? startPlayback();
                    proc.stdin?.write(audioBuffer);
                }
            }
        }
    }

    // C. Transcripciones (activadas en el setup; con modalidad AUDIO el texto
    // no llega como parte del turno, solo como transcripción)
    const inputText = response.serverContent?.inputTranscription?.text;
    if (inputText) {
        console.log(`\n🎤 Tú: ${inputText}`);
    }
    const outputText = response.serverContent?.outputTranscription?.text;
    if (outputText) {
        process.stdout.write(outputText);
    }

    if (response.serverContent?.turnComplete) {
        process.stdout.write("\n");
        turnDone = true;
        if (currentAplay && !currentAplay.stdin?.writableEnded) {
            // aplay sale solo al drenar el audio → su "close" reactiva el micrófono
            currentAplay.stdin?.end();
        }
        maybeListen();
    }

    if (response.serverContent?.interrupted) {
        console.log("\n✋ Interrumpido");
        turnDone = true;
        if (currentAplay) {
            currentAplay.kill(); // su "close" reactiva el micrófono
        } else {
            maybeListen();
        }
    }
};

ws.onerror = (error) => {
    console.error("❌ Error en el WebSocket:", error);
};

ws.onclose = () => {
    console.log("🔌 Conexión cerrada.");
};
