/**
 * server — Punto de entrada del asistente web.
 *
 * Un solo Bun.serve:
 *  - fetch → Hono (loadRoutes: convención vanui/server, deny-by-default) para /api/*,
 *  - fetch → archivos estáticos de web/,
 *  - upgrade en /ws → una GeminiSession por navegador (ver relay.ts).
 *
 * La GEMINI_API_KEY vive SOLO aquí: el navegador jamás la ve.
 */

import { join, extname, normalize } from "node:path";

import { Hono } from "hono";

import { loadRoutes } from "vanui/server";

import { GeminiSession } from "./relay";

const PORT = Number(process.env.PORT ?? 3210);
const PROJECT_ROOT = process.env.ASISTENTE_ROOT ?? import.meta.dir;
const WEB_DIR = join(import.meta.dir, "web");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ Falta GEMINI_API_KEY (asistente/.env).");
    process.exit(1);
}

const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".json": "application/json",
};

async function serveStatic(pathname: string): Promise<Response> {
    const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const file = normalize(join(WEB_DIR, rel));
    if (!file.startsWith(WEB_DIR)) return new Response("Forbidden", { status: 403 });
    const bunFile = Bun.file(file);
    if (!(await bunFile.exists())) return new Response("Not found", { status: 404 });
    return new Response(bunFile, {
        headers: { "content-type": MIME[extname(file)] ?? "application/octet-stream" },
    });
}

interface WsData {
    session?: GeminiSession;
}

const routes = await loadRoutes(join(import.meta.dir, "routes"));
const api = new Hono().route("/api", routes);

const server = Bun.serve<WsData>({
    port: PORT,
    async fetch(req, server) {
        const url = new URL(req.url);

        if (url.pathname === "/ws") {
            if (server.upgrade(req, { data: {} })) return; // handshake respondido
            return new Response("Se esperaba WebSocket", { status: 426 });
        }

        if (url.pathname.startsWith("/api/")) {
            return api.fetch(req);
        }

        return serveStatic(url.pathname);
    },
    websocket: {
        open(ws) {
            const data = ws.data as WsData;
            data.session = new GeminiSession({
                apiKey: API_KEY!,
                projectRoot: PROJECT_ROOT,
                toBrowser: (msg) => {
                    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
                },
                onBrowserGone: () => ws.close(),
            });
            console.log("🔌 Navegador conectado — sesión Gemini abriéndose…");
        },
        message(ws, message) {
            try {
                (ws.data as WsData).session?.handleBrowserMessage(message as string | ArrayBuffer);
            } catch (error) {
                // Un mensaje malo nunca debe tumbar el servidor
                console.error("⚠️ Error procesando mensaje del navegador:", error);
            }
        },
        close(ws) {
            (ws.data as WsData).session?.close();
            console.log("👋 Navegador desconectado — sesión cerrada.");
        },
    },
});

console.log(`🚀 Asistente web en http://localhost:${PORT}`);
