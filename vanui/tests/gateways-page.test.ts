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

    (globalThis as any).fetch = async (url: any) => {
      const body = String(url).includes("/gateways")
        ? { status: "ok", data: GATEWAYS }
        : { status: "ok", data: PARAMS };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const page = GatewaysPage();
    document.body.replaceChildren(page);
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
  });
});
