// demo/pages/gateways.page.ts
/**
 * GatewaysPage — Vista principal del flujo de recarga (Ruta protegida).
 *
 * Utiliza createQuery y createMutation de vanui y componentes modulares.
 * Si la petición es rechazada por falta de sesión (401), permite redirigir al login.
 */
import { van, Modal, Spin, createQuery, createMutation, navigate } from "vanui";
import { GatewaysList } from "../components/gateways-list.component.js";
import { QRGenerator } from "../components/qr-generator.component.js";
import type { Gateway, RechargeParams, RechargeResponse } from "../shared/payment.schema.js";
import { i18n } from "../shared/i18n.config.js";

const RECHARGE_ENDPOINT = "/api/payment/recharge";

export interface GatewaysPageProps {}

export const TEXTS = {
  title: { key: "gateways.title", default: "Métodos de Pago y Recarga" },
  loading: { key: "gateways.loading", default: "Cargando pasarelas..." },
  loadingParams: { key: "gateways.loadingParams", default: "Cargando parámetros..." },
  restrictedTitle: { key: "gateways.restrictedTitle", default: "Acceso Restringido" },
  restrictedMsg: { key: "gateways.restrictedMsg", default: "Debes iniciar sesión para acceder a las pasarelas de pago y recargas." },
  errorTitle: { key: "gateways.errorTitle", default: "Error al cargar datos" },
  goToLogin: { key: "gateways.goToLogin", default: "Ir al Login" },
  retry: { key: "gateways.retry", default: "Reintentar" },
  rechargeWith: { key: "gateways.rechargeWith", default: "Recargar con {name}" },
  amountLabel: { key: "gateways.amountLabel", default: "Monto a recargar ({tipo})" },
  minMaxHelp: { key: "gateways.minMaxHelp", default: "Mínimo: {min} {tipo} · Máximo: {max} {tipo}" },
  rechargeBtn: { key: "gateways.rechargeBtn", default: "Recargar" },
  generating: { key: "gateways.generating", default: "Generando..." },
  processing: { key: "gateways.processing", default: "Procesando recarga..." },
  qrTitle: { key: "gateways.qrTitle", default: "Código QR" },
  qrClickText: { key: "gateways.qrClickText", default: "Haz clic aquí para abrir la plataforma" },
  qrScanText: { key: "gateways.qrScanText", default: "o escanea el código QR con tu app móvil" },
  qrNoticeText: { key: "gateways.qrNoticeText", default: "Tu saldo se actualizará automáticamente." },
  invalidAmount: { key: "gateways.invalidAmount", default: "Ingresa un monto válido" },
  minAmountErr: { key: "gateways.minAmountErr", default: "El monto debe ser superior a {min} {tipo}" },
  maxAmountErr: { key: "gateways.maxAmountErr", default: "El monto debe ser inferior a {max} {tipo}" },
  urlGenErr: { key: "gateways.urlGenErr", default: "No se pudo generar la URL de recarga" },
  qrGenErr: { key: "gateways.qrGenErr", default: "No se pudo generar el código QR" },
  processErr: { key: "gateways.processErr", default: "Error al procesar la recarga" },
};

export const GatewaysPage = (_props: GatewaysPageProps = {}) => {
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
          validationError.val = i18n.raw(TEXTS.urlGenErr.key, undefined, TEXTS.urlGenErr.default);
          return;
        }

        const qrResult = await qr.generate(url, activeGateway.val?.img);
        if ("error" in qrResult) {
          validationError.val = i18n.raw(TEXTS.qrGenErr.key, undefined, TEXTS.qrGenErr.default);
          return;
        }

        modal.set({
          title: i18n.t(TEXTS.qrTitle.key, undefined, TEXTS.qrTitle.default),
          body: () => qrBody(qrResult.qr, url),
          footer: null,
        });
      },
      onError: (err) => {
        validationError.val = err.message || i18n.raw(TEXTS.processErr.key, undefined, TEXTS.processErr.default);
      },
    },
  );

  const openAmountModal = (gateway: Gateway) => {
    activeGateway.val = gateway;
    validationError.val = "";
    rechargeMutation.reset();
    modal.set(
      {
        title: i18n.t(TEXTS.rechargeWith.key, { name: gateway.name || gateway.id }, `Recargar con ${gateway.name || gateway.id}`),
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
      validationError.val = i18n.raw(TEXTS.invalidAmount.key, undefined, TEXTS.invalidAmount.default);
      return;
    }
    if (numAmount < parseFloat(params.monto_min_recarga)) {
      validationError.val = i18n.raw(
        TEXTS.minAmountErr.key,
        { min: params.monto_min_recarga, tipo: params.tipo },
        `El monto debe ser superior a ${params.monto_min_recarga} ${params.tipo}`,
      );
      return;
    }
    if (numAmount > parseFloat(params.monto_max_recarga)) {
      validationError.val = i18n.raw(
        TEXTS.maxAmountErr.key,
        { max: params.monto_max_recarga, tipo: params.tipo },
        `El monto debe ser inferior a ${params.monto_max_recarga} ${params.tipo}`,
      );
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
    if (!params) return div(i18n.t(TEXTS.loadingParams.key, undefined, TEXTS.loadingParams.default));

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
          i18n.t(TEXTS.amountLabel.key, { tipo: params.tipo }, `Monto a recargar (${params.tipo})`),
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
          i18n.t(
            TEXTS.minMaxHelp.key,
            { min: params.monto_min_recarga, max: params.monto_max_recarga, tipo: params.tipo },
            `Mínimo: ${params.monto_min_recarga} ${params.tipo} · Máximo: ${params.monto_max_recarga} ${params.tipo}`,
          ),
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
                  Spin(i18n.t(TEXTS.generating.key, undefined, TEXTS.generating.default)),
                  i18n.t(TEXTS.processing.key, undefined, TEXTS.processing.default),
                )
              : button(
                  {
                    type: "submit",
                    class:
                      "w-full py-2 px-4 font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition cursor-pointer",
                  },
                  i18n.t(TEXTS.rechargeBtn.key, undefined, TEXTS.rechargeBtn.default),
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
          i18n.t(TEXTS.qrClickText.key, undefined, TEXTS.qrClickText.default),
        ),
        div(
          { class: "text-muted text-sm italic mt-2 text-center" },
          i18n.t(TEXTS.qrScanText.key, undefined, TEXTS.qrScanText.default),
        ),
        img({ class: "mx-auto mt-3", src: qrData, alt: "Código QR" }),
        div(
          { class: "text-muted text-sm italic mt-2 text-center" },
          i18n.t(TEXTS.qrNoticeText.key, undefined, TEXTS.qrNoticeText.default),
        ),
      ),
    );

  return div(
    { class: "page" },
    () => {
      if (gatewaysQuery.loading.val || paramsQuery.loading.val) {
        return div(
          { class: "p-8 text-center flex items-center justify-center" },
          Spin(i18n.t(TEXTS.loading.key, undefined, TEXTS.loading.default)),
        );
      }

      const errMsg = gatewaysQuery.error.val || paramsQuery.error.val;
      if (errMsg) {
        const isUnauthorized =
          errMsg.toLowerCase().includes("no autorizado") ||
          errMsg.includes("401");

        return div(
          { class: "text-center p-8 border border-border rounded-xl bg-surface max-w-md mx-auto my-6" },
          p(
            { class: "font-semibold mb-2 text-lg text-foreground" },
            isUnauthorized
              ? i18n.t(TEXTS.restrictedTitle.key, undefined, TEXTS.restrictedTitle.default)
              : i18n.t(TEXTS.errorTitle.key, undefined, TEXTS.errorTitle.default),
          ),
          p(
            { class: "text-sm text-muted mb-6" },
            isUnauthorized
              ? i18n.t(TEXTS.restrictedMsg.key, undefined, TEXTS.restrictedMsg.default)
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
                  i18n.t(TEXTS.goToLogin.key, undefined, TEXTS.goToLogin.default),
                )
              : button(
                  {
                    class: "px-4 py-2 bg-primary text-white rounded-lg text-sm cursor-pointer",
                    onclick: () => {
                      gatewaysQuery.refetch();
                      paramsQuery.refetch();
                    },
                  },
                  i18n.t(TEXTS.retry.key, undefined, TEXTS.retry.default),
                ),
          ),
        );
      }

      const gateways = gatewaysQuery.data.val || [];
      return div(
        {},
        h1({ class: "text-2xl font-bold text-center mb-6" }, i18n.t(TEXTS.title.key, undefined, TEXTS.title.default)),
        div(
          { class: "flex justify-center" },
          GatewaysList(gateways, openAmountModal),
        ),
      );
    },
  );
};
