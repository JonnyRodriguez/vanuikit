import { Hono } from "hono";

// Ruta pública de salud — prueba de que la convención loadRoutes queda cableada
// (deny-by-default: toda ruta nueva sin meta.public queda protegida).
export const meta = { public: true };

const app = new Hono();

app.get("/", (c) => c.json({ ok: true, ts: Date.now() }));

export default app;
