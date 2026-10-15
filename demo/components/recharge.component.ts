// demo/components/***REMOVED***.component.ts
/**
 * ***REMOVED*** Component — Modales y formularios de ***REMOVED***.
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
import { ***REMOVED***Item } from "./***REMOVED***-list.component.js";
import type { ***REMOVED***, ***REMOVED***Params } from "../shared/***REMOVED***.schema.js";

export type ***REMOVED***Result = { error: string } | {};

export interface ***REMOVED***Info {
  ***REMOVED***: ***REMOVED***;
  params: ***REMOVED***Params;
  handle***REMOVED***Amount: (data: Record<string, unknown>) => Promise<***REMOVED***Result>;
}

const Between = (
  min: number,
  max: number,
  tipo: string,
): Validator => ({
  validate: (value) => {
    const num = parseFloat(value);
    if (!value || Number.isNaN(num)) return i18n.raw("***REMOVED***.invalidAmount", "Ingresa un monto válido");
    if (num < min) {
      return i18n.raw("***REMOVED***.minAmountErr", `El monto debe ser superior a ${min} ${tipo}`, { min, tipo });
    }
    if (num > max) {
      return i18n.raw("***REMOVED***.maxAmountErr", `El monto debe ser inferior a ${max} ${tipo}`, { max, tipo });
    }
    return null;
  },
});

export const ***REMOVED***Amount = (info: ***REMOVED***Info) => {
  const { div } = van.tags;

  const msg = van.state<Element | null>(null);
  const formError = van.state("");

  const params = info.params;
  const ***REMOVED*** = info.***REMOVED***;

  const amount = Field({
    label: t("***REMOVED***.amountLabel", `Monto a ***REMOVED***r (${params.tipo})`, { tipo: params.tipo }),
    name: "amount",
    inputType: "number",
  });
  amount.addValidator(
    Between(
      parseFloat(params.monto_min_***REMOVED***),
      parseFloat(params.monto_max_***REMOVED***),
      params.tipo,
    ),
  );

  const form = Form(async (data) => {
    formError.val = "";
    msg.val = Spin(t("***REMOVED***.generating", "Generando..."));
    data.***REMOVED*** = ***REMOVED***;
    const result = await info.handle***REMOVED***Amount(data);
    if ("error" in result) {
      formError.val = result.error;
      msg.val = null;
    }
  });
  form.add(amount);

  return div(
    {},
    ***REMOVED***Item(***REMOVED***),
    div(
      { class: "mt-8" },
      form.dom(
        div(
          { class: "text-muted text-sm mt-2" },
          t("***REMOVED***.minMaxHelp", `Mínimo: ${params.monto_min_***REMOVED***} ${params.tipo} · Máximo: ${params.monto_max_***REMOVED***} ${params.tipo}`, { min: params.monto_min_***REMOVED***, max: params.monto_max_***REMOVED***, tipo: params.tipo }),
        ),
        div(
          { class: "pt-4" },
          () =>
            (msg.val && msg.val) ||
            PrimaryButton(
              { type: "submit" },
              t("***REMOVED***.***REMOVED***Btn", "***REMOVED***r"),
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

export const ***REMOVED***AmountModal = (info: ***REMOVED***Info): ModalProps => ({
  title: t("***REMOVED***.***REMOVED***With", `***REMOVED***r con ${info.***REMOVED***.name || info.***REMOVED***.id}`, { name: info.***REMOVED***.name || info.***REMOVED***.id }),
  body: () => ***REMOVED***Amount(info),
});

export const ***REMOVED***Qr = (qr: string, url: string) => {
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
        t("***REMOVED***.qrClickText", "Haz clic aquí para abrir la plataforma"),
      ),
      div(
        { class: "text-muted text-sm italic" },
        t("***REMOVED***.qrScanText", "o escanea el código QR con tu app móvil"),
      ),
      img({
        class: "mx-auto",
        src: qr,
        alt: t("***REMOVED***.qrAlt", "Código QR"),
      }),
      div(
        { class: "text-muted text-sm italic" },
        t("***REMOVED***.qrNoticeText", "Tu saldo se actualizará automáticamente."),
      ),
    ),
  );
};

export const ***REMOVED***QrModal = (qr: string, url: string): ModalContent => ({
  body: () => ***REMOVED***Qr(qr, url),
});
