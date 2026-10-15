// demo/components/recharge.component.ts
/**
 * Recharge Component — Modales y formularios de recarga.
 */
import { van } from "vanui";
import {
  Form,
  Field,
  PrimaryButton,
  Spin,
  t,
  i18n,
  type Validator,
  type ModalContent,
  type ModalProps,
} from "vanui";
import { GatewayItem } from "./gateways-list.component.js";
import type { Gateway, RechargeParams } from "../shared/payment.schema.js";

export type RecargaResult = { error: string } | {};

export interface RechargeInfo {
  gateway: Gateway;
  params: RechargeParams;
  handleRechargeAmount: (data: Record<string, unknown>) => Promise<RecargaResult>;
}

const Between = (
  min: number,
  max: number,
  tipo: string,
): Validator => ({
  validate: (value) => {
    const num = parseFloat(value);
    if (!value || Number.isNaN(num)) return i18n.raw("gateways.invalidAmount", "Ingresa un monto válido");
    if (num < min) {
      return i18n.raw("gateways.minAmountErr", `El monto debe ser superior a ${min} ${tipo}`, { min, tipo });
    }
    if (num > max) {
      return i18n.raw("gateways.maxAmountErr", `El monto debe ser inferior a ${max} ${tipo}`, { max, tipo });
    }
    return null;
  },
});

export const RechargeAmount = (info: RechargeInfo) => {
  const { div } = van.tags;

  const msg = van.state<Element | null>(null);
  const formError = van.state("");

  const params = info.params;
  const gateway = info.gateway;

  const amount = Field({
    label: t("gateways.amountLabel", `Monto a recargar (${params.tipo})`, { tipo: params.tipo }),
    name: "amount",
    inputType: "number",
  });
  amount.addValidator(
    Between(
      parseFloat(params.monto_min_recarga),
      parseFloat(params.monto_max_recarga),
      params.tipo,
    ),
  );

  const form = Form(async (data) => {
    formError.val = "";
    msg.val = Spin(t("gateways.generating", "Generando..."));
    data.gateway = gateway;
    const result = await info.handleRechargeAmount(data);
    if ("error" in result) {
      formError.val = result.error;
      msg.val = null;
    }
  });
  form.add(amount);

  return div(
    {},
    GatewayItem(gateway),
    div(
      { class: "mt-8" },
      form.dom(
        div(
          { class: "text-muted text-sm mt-2" },
          t("gateways.minMaxHelp", `Mínimo: ${params.monto_min_recarga} ${params.tipo} · Máximo: ${params.monto_max_recarga} ${params.tipo}`, { min: params.monto_min_recarga, max: params.monto_max_recarga, tipo: params.tipo }),
        ),
        div(
          { class: "pt-4" },
          () =>
            (msg.val && msg.val) ||
            PrimaryButton(
              { type: "submit" },
              t("gateways.rechargeBtn", "Recargar"),
            ),
        ),
      ),
      () =>
        formError.val
          ? van.tags.p({ class: "text-destructive text-sm mt-3" }, formError.val)
          : "",
    ),
  );
};

export const RechargeAmountModal = (info: RechargeInfo): ModalProps => ({
  title: t("gateways.rechargeWith", `Recargar con ${info.gateway.name || info.gateway.id}`, { name: info.gateway.name || info.gateway.id }),
  body: () => RechargeAmount(info),
});

export const RechargeQr = (qr: string, url: string) => {
  const { div, button, img, span } = van.tags;

  return div(
    {},
    button(
      {
        class:
          "block border-4 border-accent rounded-2xl p-4 my-4 w-full bg-background shadow-xl cursor-pointer " +
          "transition-all duration-200 ease-in-out " +
          "hover:border-accent-hover hover:shadow-2xl hover:-translate-y-0.5 hover:scale-105",
        type: "button",
        onclick: () => window.open(url, "_blank"),
      },
      span(
        { class: "text-xl font-bold text-accent flex items-center" },
        t("gateways.qrClickText", "Haz clic aquí para abrir la plataforma"),
      ),
      div(
        { class: "text-muted text-sm italic" },
        t("gateways.qrScanText", "o escanea el código QR con tu app móvil"),
      ),
      img({
        class: "mx-auto",
        src: qr,
        alt: t("gateways.qrAlt", "Código QR"),
      }),
      div(
        { class: "text-muted text-sm italic" },
        t("gateways.qrNoticeText", "Tu saldo se actualizará automáticamente."),
      ),
    ),
  );
};

export const RechargeQrModal = (qr: string, url: string): ModalContent => ({
  body: () => RechargeQr(qr, url),
});
