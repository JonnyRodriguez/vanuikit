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

export const TEXTS = {
  amountLabel: { key: "gateways.amountLabel", default: "Monto a recargar ({tipo})" },
  minMaxHelp: { key: "gateways.minMaxHelp", default: "Mínimo: {min} {tipo} · Máximo: {max} {tipo}" },
  rechargeBtn: { key: "gateways.rechargeBtn", default: "Recargar" },
  generating: { key: "gateways.generating", default: "Generando recarga..." },
  rechargeWith: { key: "gateways.rechargeWith", default: "Recargar con {name}" },
  qrClickText: { key: "gateways.qrClickText", default: "Haz clic aquí para abrir la plataforma" },
  qrScanText: { key: "gateways.qrScanText", default: "o escanea el código QR con tu app móvil" },
  qrNoticeText: { key: "gateways.qrNoticeText", default: "Tu saldo se actualizará automáticamente." },
  invalidAmount: { key: "gateways.invalidAmount", default: "Ingresa un monto válido" },
  minAmountErr: { key: "gateways.minAmountErr", default: "El monto debe ser superior a {min} {tipo}" },
  maxAmountErr: { key: "gateways.maxAmountErr", default: "El monto debe ser inferior a {max} {tipo}" },
};

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
    if (!value || Number.isNaN(num)) return i18n.raw(TEXTS.invalidAmount.key, undefined, TEXTS.invalidAmount.default);
    if (num < min) {
      return i18n.raw(
        TEXTS.minAmountErr.key,
        { min, tipo },
        `El monto debe ser superior a ${min} ${tipo}`,
      );
    }
    if (num > max) {
      return i18n.raw(
        TEXTS.maxAmountErr.key,
        { max, tipo },
        `El monto debe ser inferior a ${max} ${tipo}`,
      );
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
    label: t(TEXTS.amountLabel.key, { tipo: params.tipo }, `Monto a recargar (${params.tipo})`),
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
    msg.val = Spin(t(TEXTS.generating.key, undefined, TEXTS.generating.default));
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
          t(
            TEXTS.minMaxHelp.key,
            { min: params.monto_min_recarga, max: params.monto_max_recarga, tipo: params.tipo },
            `Mínimo: ${params.monto_min_recarga} ${params.tipo} · Máximo: ${params.monto_max_recarga} ${params.tipo}`,
          ),
        ),
        div(
          { class: "pt-4" },
          () =>
            (msg.val && msg.val) ||
            PrimaryButton(
              { type: "submit" },
              t(TEXTS.rechargeBtn.key, undefined, TEXTS.rechargeBtn.default),
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
  title: t(
    TEXTS.rechargeWith.key,
    { name: info.gateway.name || info.gateway.id },
    `Recargar con ${info.gateway.name || info.gateway.id}`,
  ),
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
        t(TEXTS.qrClickText.key, undefined, TEXTS.qrClickText.default),
      ),
      div(
        { class: "text-muted text-sm italic" },
        t(TEXTS.qrScanText.key, undefined, TEXTS.qrScanText.default),
      ),
      img({
        class: "mx-auto",
        src: qr,
        alt: "Código QR",
      }),
      div(
        { class: "text-muted text-sm italic" },
        t(TEXTS.qrNoticeText.key, undefined, TEXTS.qrNoticeText.default),
      ),
    ),
  );
};

export const RechargeQrModal = (qr: string, url: string): ModalContent => ({
  body: () => RechargeQr(qr, url),
});
