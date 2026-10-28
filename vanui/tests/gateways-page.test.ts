import { describe, test, expect } from "bun:test";
import { GatewaysPage } from "../../demo/pages/gateways.page.js";
import { i18n } from "../../demo/shared/i18n.config.js";

const flush = () => new Promise((r) => setTimeout(r, 25));

const GATEWAYS = [
  { id: "BINANCE", name: "Binance", img: "/img/binance.svg", currency: "USD" },
  { id: "BANCOS", name: "Bancos", img: "/img/bancos.svg", currency: "USD" },
];
const PARAMS = { tipo: "USD", monto_min_recarga: "10", monto_max_recarga: "10000" };

describe("GatewaysPage (demo)", () => {
  test("lista las pasarelas cuando el backend responde", async () => {
    i18n.setLocale("es");
    localStorage.setItem("session_token", "test-token");

    const calls: string[] = [];
    (globalThis as any).fetch = async (url: any) => {
      const u = String(url);
      calls.push(u);
      let body: any;
      if (u.includes("/gateways")) body = { status: "ok", data: GATEWAYS };
      else if (u.includes("/params")) body = { status: "ok", data: PARAMS };
      else if (u.includes("/recharge"))
        body = {
          status: "ok",
          data: { url: "https://plataforma.example/payments/recarga-123" },
        };
      else body = { status: "ok", data: {} };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    // Limpia body ANTES de construir la página: el modal hace mount() en el
    // constructor, así que debe quedar como hermano del contenedor de la página.
    document.body.replaceChildren();
    const page = GatewaysPage();
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.appendChild(page);
    await flush();
    await flush();

    expect(document.body.textContent).toContain("Binance");
    expect(document.body.textContent).toContain("Bancos");

    // Click en Binance => auto-avanza al paso 2 y muestra la selección.
    const binanceBtn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent!.includes("Binance"),
    );
    expect(binanceBtn).toBeTruthy();
    binanceBtn!.click();
    await flush();
    console.log("AFTER CLICK:", document.body.innerHTML);
    await flush();
    console.log("AFTER CLICK2:", document.body.innerHTML);

    expect(document.body.textContent).toContain("Monto"); // título paso 2
    expect(document.body.textContent).toContain("Pasarela seleccionada");
    expect(document.body.textContent).toContain("Cambiar"); // botón Cambiar
    expect(document.body.textContent).toContain("Binance");

    // Completar el monto y enviar => debe llamar al backend y abrir el QR.
    const amount = document.querySelector('input[name="amount"]') as HTMLInputElement;
    amount.value = "50";
    amount.dispatchEvent(new Event("input", { bubbles: true }));
    const submitBtn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent!.trim() === "Enviar",
    );
    expect(submitBtn).toBeTruthy();
    submitBtn!.click();
    await flush();
    await flush();
    await flush();

    expect(calls.some((u) => u.includes("/recharge"))).toBe(true);
    expect(document.body.textContent).toContain("Código QR");
    const qrImg = document.querySelector("img[src^='data:']") as HTMLImageElement | null;
    expect(qrImg).toBeTruthy();
  });
});
