/**
 * GatewaysScreen — pantalla principal del flujo de recarga.
 *
 * Patrón store/web: un componente (función) que devuelve DOM reactivo.
 * Es la dueña de sus propios datos: carga gateways + params desde el
 * backend y muestra un spinner mientras tanto. El Nav global y el título
 * de la app viven en el shell de App (app.ts), no en cada pantalla.
 *
 * El flujo:
 *   1. GatewaysList → al hacer clic, abre el modal de monto
 *   2. formulario de monto → POST /api/payment/recharge → genera URL
 *   3. QRGenerator → abre el modal de QR
 */
import { van } from "vanui";
import { Modal, Spin } from "vanui";
import { GatewaysList, type Gateway } from "./gateways.js";
import { QRGenerator } from "./qr.js";

export type RechargeParams = {
  id: number;
  tipo: string;
  monto_min_recarga: string;
  monto_max_recarga: string;
  [key: string]: unknown;
};

type PaymentData = { gateways: Gateway[]; params: RechargeParams };

const RECHARGE_ENDPOINT = "/api/payment/recharge";

/** Carga gateways + params desde el backend Hono (datos propios de la pantalla). */
async function loadPaymentData(): Promise<PaymentData> {
  const [gwRes, paramsRes] = await Promise.all([
    fetch("/api/payment/gateways"),
    fetch("/api/payment/params"),
  ]);

  if (!gwRes.ok || !paramsRes.ok) {
    throw new Error("No se pudieron cargar los datos del backend");
  }

  const [gwJson, paramsJson] = await Promise.all([
    gwRes.json(),
    paramsRes.json(),
  ]);

  return { gateways: gwJson.data, params: paramsJson.data };
}

export const GatewaysScreen = () => {
  const { div, h1, p, form, input, button, img, span, hr } = van.tags;

  // Datos de la pantalla: se cargan aquí, no en App.
  const data = van.state<PaymentData | null>(null);
  const loadError = van.state<string | null>(null);

  loadPaymentData()
    .then((payload) => (data.val = payload))
    .catch((err) => {
      console.error("Error cargando datos de pago:", err);
      loadError.val = "No se pudieron cargar los datos del backend";
    });

  const modal = Modal();
  modal.mount();

  const qr = new QRGenerator();

  // Gateway activo en el flujo (monto → QR).
  const activeGateway = van.state<Gateway | null>(null);
  // Estado de envío del formulario de monto.
  const formError = van.state("");
  const isGenerating = van.state(false);

  const openAmountModal = (gateway: Gateway) => {
    activeGateway.val = gateway;
    formError.val = "";
    modal.set(
      {
        title: `Recargar con ${gateway.id}`,
        body: () => amountBody(),
        footer: null,
      },
      true,
    );
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const amount = (formEl.elements.namedItem("amount") as HTMLInputElement).value;
    const params = data.val!.params;

    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount)) {
      formError.val = "Ingresa un monto válido";
      return;
    }
    if (numAmount < parseFloat(params.monto_min_recarga)) {
      formError.val = `El monto debe ser superior a ${params.monto_min_recarga} ${params.tipo}`;
      return;
    }
    if (numAmount > parseFloat(params.monto_max_recarga)) {
      formError.val = `El monto debe ser inferior a ${params.monto_max_recarga} ${params.tipo}`;
      return;
    }

    formError.val = "";
    isGenerating.val = true;

    try {
      const res = await fetch(RECHARGE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          gateway: activeGateway.val,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        formError.val = result.error || "No se pudo generar la recarga";
        return;
      }

      const url: string = result.data?.url;
      if (!url) {
        formError.val = "No se pudo generar la recarga";
        return;
      }

      const qrResult = await qr.generate(url, activeGateway.val?.img);
      if ("error" in qrResult) {
        formError.val = "No se pudo generar el código QR";
        return;
      }

      modal.set({
        title: "Código QR",
        body: () => qrBody(qrResult.qr, url),
        footer: null,
      });
    } catch {
      formError.val = "Error de conexión, intenta de nuevo";
    } finally {
      isGenerating.val = false;
    }
  };

  /** Cuerpo del modal de monto: badge + formulario. */
  const amountBody = () => {
    const params = data.val!.params;
    return div(
      {},
      () =>
        activeGateway.val
          ? div(
              {
                class:
                  "flex items-center gap-3 p-3 bg-background border border-border rounded-lg",
              },
              img({
                class: "h-8 w-auto",
                src: activeGateway.val!.img,
                alt: activeGateway.val!.name,
              }),
              span(
                { class: "font-bold text-foreground" },
                activeGateway.val!.name,
              ),
            )
          : div(),
      hr({ class: "my-4 border-border" }),
      form(
        { onsubmit: handleSubmit, class: "space-y-4" },
        div(
          { class: "mb-1 text-sm font-medium text-foreground" },
          "Monto a recargar (",
          params.tipo,
          ")",
        ),
        input({
          type: "number",
          name: "amount",
          required: true,
          min: params.monto_min_recarga,
          max: params.monto_max_recarga,
          step: "0.01",
          class:
            "w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-focus focus:border-transparent outline-none bg-background text-foreground",
          placeholder: `${params.monto_min_recarga} - ${params.monto_max_recarga}`,
        }),
        p(
          { class: "text-xs text-muted" },
          `Mínimo: ${params.monto_min_recarga} ${params.tipo} · Máximo: ${params.monto_max_recarga} ${params.tipo}`,
        ),
        div(
          { class: "pt-2" },
          () =>
            formError.val
              ? p({ class: "text-destructive text-sm mb-2" }, formError.val)
              : "",
          () =>
            isGenerating.val
              ? div(
                  { class: "flex items-center gap-2 text-sm text-foreground" },
                  Spin("Generando..."),
                  "Procesando recarga",
                )
              : button(
                  {
                    type: "submit",
                    class:
                      "w-full py-2 px-4 font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition cursor-pointer",
                  },
                  "Recargar",
                ),
        ),
      ),
    );
  };

  /** Cuerpo del modal de QR. */
  const qrBody = (qrData: string, url: string) =>
    div(
      {},
      button(
        {
          type: "button",
          onclick: () => window.open(url, "_blank"),
          class:
            "block w-full border-4 border-accent rounded-2xl p-4 my-4 bg-background shadow-xl cursor-pointer " +
            "transition-all duration-200 ease-in-out " +
            "hover:border-accent-hover hover:shadow-2xl hover:-translate-y-0.5 hover:scale-105",
        },
        span(
          { class: "text-xl font-bold text-accent flex items-center justify-center" },
          "Haz clic aquí para abrir la plataforma",
        ),
        div(
          { class: "text-muted text-sm italic mt-2 text-center" },
          "o escanea el código QR con tu app móvil",
        ),
        img({ class: "mx-auto mt-3", src: qrData, alt: "Código QR para recargar" }),
        div(
          { class: "text-muted text-sm italic mt-2 text-center" },
          "Tu saldo se actualizará automáticamente.",
        ),
      ),
    );

  return div(
    { class: "page" },
    () =>
      data.val
        ? div(
            {},
            h1({ class: "text-2xl font-bold text-center mb-6" }, "Recargar saldo"),
            div(
              { class: "flex justify-center" },
              GatewaysList(data.val.gateways, openAmountModal),
            ),
          )
        : loadError.val
          ? div({ class: "text-center p-4 text-destructive" }, loadError.val)
          : div({ class: "p-4 text-center" }, "Cargando pasarelas..."),
  );
};