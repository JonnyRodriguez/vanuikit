// demo/pages/gateways.page.ts
/**
 * GatewaysPage — Vista principal del flujo de recarga (Ruta protegida).
 *
 * Convertido a un Wizard de 2 pasos (pasarela → monto) que consume el
 * contrato FormResult end-to-end con el backend real:
 *   · paso 1: selección de pasarela (validación por schema)
 *   · paso 2: monto con validadores de campo (min/máx desde parámetros)
 *   · submit: POST /api/payment/recharge → { ok } / { error } / { fieldErrors }
 */
import { van, Modal, Spin, createQuery, createMutation, navigate, Wizard, Field, Required, t, type Validator } from "vanui";
import { GatewaysList } from "../components/gateways-list.component.js";
import { QRGenerator } from "../components/qr-generator.component.js";
import type { Gateway, RechargeParams, RechargeResponse } from "../shared/payment.schema.js";
import { i18n } from "../shared/i18n.config.js";

const RECHARGE_ENDPOINT = "/api/payment/recharge";

export const GatewaysPage = () => {
  const { div, h1, p, span, img, hr, button } = van.tags;

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

  // Mutación reactiva para generar la recarga (onSuccess abre el QR).
  const rechargeMutation = createMutation<{ status: string; data: RechargeResponse }, any>(
    RECHARGE_ENDPOINT,
    {
      onSuccess: async (result) => {
        const url = result.data?.url;
        if (!url) return;
        const qrResult = await qr.generate(url, activeGateway.val?.img);
        if ("error" in qrResult) return;
        modal.set({
          title: i18n.t("gateways.qrTitle", "Código QR"),
          body: () => qrBody(qrResult.qr, url),
          footer: null,
        });
      },
    },
  );

  // Validador de monto: lee los parámetros reactivos en tiempo de validación.
  const amountValidator: Validator = {
    validate(value) {
      const params = paramsQuery.data.val;
      if (!params) return null;
      const n = parseFloat(value);
      if (Number.isNaN(n)) {
        return i18n.raw("gateways.invalidAmount", "Ingresa un monto válido");
      }
      if (n < parseFloat(params.monto_min_recarga)) {
        return i18n.raw(
          "gateways.minAmountErr",
          `El monto debe ser superior a ${params.monto_min_recarga} ${params.tipo}`,
          { min: params.monto_min_recarga, tipo: params.tipo },
        );
      }
      if (n > parseFloat(params.monto_max_recarga)) {
        return i18n.raw(
          "gateways.maxAmountErr",
          `El monto debe ser inferior a ${params.monto_max_recarga} ${params.tipo}`,
          { max: params.monto_max_recarga, tipo: params.tipo },
        );
      }
      return null;
    },
  };

  const amountLabel = van.derive(() => {
    const p = paramsQuery.data.val;
    return p
      ? i18n.raw("gateways.amountLabel", "Monto a recargar ({tipo})", { tipo: p.tipo })
      : "";
  });

  const amountHint = van.derive(() => {
    const p = paramsQuery.data.val;
    return p
      ? i18n.raw(
          "gateways.minMaxHelp",
          "Mínimo: {min} {tipo} · Máximo: {max} {tipo}",
          { min: p.monto_min_recarga, max: p.monto_max_recarga, tipo: p.tipo },
        )
      : "";
  });

  const amountField = Field({
    label: amountLabel,
    name: "amount",
    inputType: "number",
    placeholder: "0.00",
    hint: amountHint,
  })
    .addValidator(Required(t("gateways.amountRequired", "Ingresa un monto")))
    .addValidator(amountValidator);

  const wizard = Wizard({
    steps: [
      {
        title: i18n.t("gateways.wizardStepGateway", "Pasarela"),
        // El valor vive en `activeGateway` (componente de selección), no en un field.
        collect: () => ({ gateway: activeGateway.val }),
        schema: {
          safeParse: () =>
            activeGateway.val
              ? { success: true, data: {} }
              : {
                  success: false,
                  error: {
                    issues: [
                      {
                        path: ["gateway"],
                        message: i18n.raw("gateways.selectGateway", "Selecciona una pasarela"),
                      },
                    ],
                  },
                },
        },
        content: [
          // Hijo-función reactivo: se reconstruye cuando llegan las pasarelas
          // y refleja la selección actual. Al elegir, auto-avanza al monto.
          () =>
            GatewaysList(
              gatewaysQuery.data.val || [],
              (gateway) => {
                activeGateway.val = gateway;
                wizard.next();
              },
              activeGateway.val?.id ?? null,
            ),
        ],
      },
      {
        title: i18n.t("gateways.wizardStepAmount", "Monto"),
        fields: [amountField],
        content: [
          // Hijo-función DIRECTO (no anidado en un div): lee activeGateway y
          // muestra la selección; evita el freeze de bindings anidados.
          () =>
            activeGateway.val
              ? div(
                  {
                    class: "flex items-center gap-3 p-3 bg-background border border-border rounded-lg",
                  },
                  img({
                    class: "h-8 w-auto",
                    src: activeGateway.val!.img,
                    alt: activeGateway.val!.name,
                  }),
                  div(
                    { class: "min-w-0" },
                    div(
                      {
                        class: "text-xs uppercase tracking-wide text-foreground-soft",
                      },
                      i18n.t("gateways.selectedGateway", "Pasarela seleccionada"),
                    ),
                    div(
                      { class: "font-bold text-foreground truncate" },
                      activeGateway.val!.name,
                    ),
                  ),
                  button(
                    {
                      type: "button",
                      class:
                        "ml-auto shrink-0 text-xs px-3 py-1.5 rounded-md border " +
                        "border-border text-foreground-soft hover:border-accent " +
                        "hover:text-accent transition cursor-pointer",
                      onclick: () => wizard.goTo(0),
                    },
                    i18n.t("gateways.changeGateway", "Cambiar"),
                  ),
                )
              : "",
        ],
      },
    ],
    onSubmit: async (data) => {
      const res = await rechargeMutation.mutate({
        amount: String(data.amount ?? ""),
        gateway: data.gateway,
      });
      if (rechargeMutation.error.val) {
        return { ok: false, error: rechargeMutation.error.val };
      }
      const body = res as { status?: string; data?: RechargeResponse } | null;
      if (!body?.data?.url) {
        return { ok: false, error: i18n.raw("gateways.urlGenErr", "No se pudo generar la URL de recarga") };
      }
      return { ok: true };
    },
  });

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
          i18n.raw("gateways.qrClickText", "Haz clic aquí para abrir la plataforma"),
        ),
        div(
          { class: "text-muted text-sm italic mt-2 text-center" },
          i18n.raw("gateways.qrScanText", "o escanea el código QR con tu app móvil"),
        ),
        img({ class: "mx-auto mt-3", src: qrData, alt: i18n.raw("gateways.qrAlt", "Código QR") }),
        div(
          { class: "text-muted text-sm italic mt-2 text-center" },
          i18n.raw("gateways.qrNoticeText", "Tu saldo se actualizará automáticamente."),
        ),
      ),
    );

  // Overlay de carga: cubre la página (incluido el wizard) mientras cargan datos.
  const loadingOverlay = () =>
    gatewaysQuery.loading.val || paramsQuery.loading.val
      ? div(
          {
            class: "absolute inset-0 z-10 flex items-center justify-center bg-background/90",
          },
          Spin(i18n.t("gateways.loading", "Cargando pasarelas...")),
        )
      : "";

  // Overlay de error: cubre la página cuando falla alguna query.
  const errorOverlay = () => {
    const errMsg = gatewaysQuery.error.val || paramsQuery.error.val;
    if (!errMsg) return "";
    const isUnauthorized =
      errMsg.toLowerCase().includes("no autorizado") || errMsg.includes("401");
    return div(
      { class: "absolute inset-0 z-10 flex items-center justify-center" },
      div(
        { class: "text-center p-8 border border-border rounded-xl bg-surface max-w-md mx-auto" },
        p(
          { class: "font-semibold mb-2 text-lg text-foreground" },
          isUnauthorized
            ? i18n.t("gateways.restrictedTitle", "Acceso Restringido")
            : i18n.t("gateways.errorTitle", "Error al cargar datos"),
        ),
        p(
          { class: "text-sm text-muted mb-6" },
          isUnauthorized
            ? i18n.t("gateways.restrictedMsg", "Debes iniciar sesión para acceder a las pasarelas de pago y recargas.")
            : errMsg,
        ),
        div(
          { class: "flex gap-3 justify-center" },
          isUnauthorized
            ? button(
                {
                  class: "px-5 py-2.5 bg-primary text-white font-medium rounded-lg text-sm cursor-pointer hover:bg-primary-hover transition",
                  onclick: () => navigate("/login?redirect=/gateways"),
                },
                i18n.t("gateways.goToLogin", "Ir al Login"),
              )
            : button(
                {
                  class: "px-4 py-2 bg-primary text-white rounded-lg text-sm cursor-pointer",
                  onclick: () => {
                    gatewaysQuery.refetch();
                    paramsQuery.refetch();
                  },
                },
                i18n.t("gateways.retry", "Reintentar"),
              ),
        ),
      ),
    );
  };

  // El wizard se monta DIRECTO (no dentro de un Der), para que el contenido
  // reactivo del paso (listado de pasarelas) reciba las actualizaciones de la
  // query. Los overlays de carga/error son hermanos independientes.
  return div(
    { class: "page relative" },
    () => loadingOverlay(),
    () => errorOverlay(),
    h1({ class: "text-2xl font-bold text-center mb-6" }, i18n.t("gateways.title", "Métodos de Pago y Recarga")),
    div({ class: "max-w-xl mx-auto" }, wizard.dom()),
  );
};
