// demo/pages/gateways.page.ts
/**
 * GatewaysPage — Vista principal del flujo de recarga (Ruta protegida).
 *
 * Utiliza createQuery y createMutation de vanui y componentes modulares.
 * Si la petición es rechazada por falta de sesión (401), permite redirigir al login.
 */
import { van, Modal, Spin, createQuery, createMutation, type Router } from "vanui";
import { GatewaysList } from "../components/gateways-list.component.js";
import { QRGenerator } from "../components/qr-generator.component.js";
import type { Gateway, RechargeParams, RechargeResponse } from "../shared/payment.schema.js";

const RECHARGE_ENDPOINT = "/api/payment/recharge";

export interface GatewaysPageProps {
  router?: Router;
}

export const GatewaysPage = ({ router }: GatewaysPageProps = {}) => {
  const { div, h1, p, form, input, button, img, span, hr } = van.tags;

  // Carga reactiva de datos protegidos por sesión
  const gatewaysQuery = createQuery<Gateway[]>("/api/payment/gateways", {
    transform: (json) => json.data,
  });

  const paramsQuery = createQuery<RechargeParams>("/api/payment/params", {
    transform: (json) => json.data,
  });

  const modal = Modal();
  modal.mount();

  const qr = new QRGenerator();

  const activeGateway = van.state<Gateway | null>(null);
  const validationError = van.state("");

  // Mutación reactiva para generar la recarga
  const rechargeMutation = createMutation<{ status: string; data: RechargeResponse }, any>(
    RECHARGE_ENDPOINT,
    {
      onSuccess: async (result) => {
        const url = result.data?.url;
        if (!url) {
          validationError.val = "No se pudo generar la URL de recarga";
          return;
        }

        const qrResult = await qr.generate(url, activeGateway.val?.img);
        if ("error" in qrResult) {
          validationError.val = "No se pudo generar el código QR";
          return;
        }

        modal.set({
          title: "Código QR",
          body: () => qrBody(qrResult.qr, url),
          footer: null,
        });
      },
      onError: (err) => {
        validationError.val = err.message || "Error al procesar la recarga";
      },
    },
  );

  const openAmountModal = (gateway: Gateway) => {
    activeGateway.val = gateway;
    validationError.val = "";
    rechargeMutation.reset();
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
    const params = paramsQuery.data.val;

    if (!params) return;

    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount)) {
      validationError.val = "Ingresa un monto válido";
      return;
    }
    if (numAmount < parseFloat(params.monto_min_recarga)) {
      validationError.val = `El monto debe ser superior a ${params.monto_min_recarga} ${params.tipo}`;
      return;
    }
    if (numAmount > parseFloat(params.monto_max_recarga)) {
      validationError.val = `El monto debe ser inferior a ${params.monto_max_recarga} ${params.tipo}`;
      return;
    }

    validationError.val = "";
    await rechargeMutation.mutate({
      amount,
      gateway: activeGateway.val,
    });
  };

  /** Cuerpo del modal de monto */
  const amountBody = () => {
    const params = paramsQuery.data.val;
    if (!params) return div("Cargando parámetros...");

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
          () => {
            const err = validationError.val || rechargeMutation.error.val;
            return err ? p({ class: "text-destructive text-sm mb-2" }, err) : "";
          },
          () =>
            rechargeMutation.loading.val
              ? div(
                  { class: "flex items-center gap-2 text-sm text-foreground justify-center py-2" },
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

  /** Cuerpo del modal de QR */
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
    () => {
      if (gatewaysQuery.loading.val || paramsQuery.loading.val) {
        return div(
          { class: "p-8 text-center flex items-center justify-center gap-3" },
          Spin(),
          "Cargando pasarelas...",
        );
      }

      const errMsg = gatewaysQuery.error.val || paramsQuery.error.val;
      if (errMsg) {
        const isUnauthorized =
          errMsg.toLowerCase().includes("no autorizado") ||
          errMsg.includes("401");

        return div(
          { class: "text-center p-8 border border-border rounded-xl bg-surface max-w-md mx-auto my-6" },
          p({ class: "font-semibold mb-2 text-lg text-foreground" }, isUnauthorized ? "Acceso Restringido" : "Error al cargar datos"),
          p({ class: "text-sm text-muted mb-6" }, isUnauthorized ? "Debes iniciar sesión para acceder a las pasarelas de pago y recargas." : errMsg),
          div(
            { class: "flex gap-3 justify-center" },
            isUnauthorized && router
              ? button(
                  {
                    class: "px-5 py-2.5 bg-primary text-white font-medium rounded-lg text-sm cursor-pointer hover:bg-primary-hover transition",
                    onclick: () => router.navigate("/login?redirect=/gateways"),
                  },
                  "Ir al Login",
                )
              : button(
                  {
                    class: "px-4 py-2 bg-primary text-white rounded-lg text-sm cursor-pointer",
                    onclick: () => {
                      gatewaysQuery.refetch();
                      paramsQuery.refetch();
                    },
                  },
                  "Reintentar",
                ),
          ),
        );
      }

      const gateways = gatewaysQuery.data.val || [];
      return div(
        {},
        h1({ class: "text-2xl font-bold text-center mb-6" }, "Recargar saldo"),
        div(
          { class: "flex justify-center" },
          GatewaysList(gateways, openAmountModal),
        ),
      );
    },
  );
};
