/**
 * Referencia — pantallas del flujo de ***REMOVED*** construidas con los
 * componentes de la librería (Form, Field, Button, Modal, Spin).
 */
import { van } from "vanui";
import {
  Form,
  Field,
  PrimaryButton,
  Spin,
  type Validator,
  type ModalContent,
  type ModalProps,
} from "vanui";
import { ***REMOVED***Item, type ***REMOVED*** } from "./***REMOVED***.js";

export type ***REMOVED***Params = {
  id: number;
  tipo: string;
  monto_min_***REMOVED***: string;
  monto_max_***REMOVED***: string;
  [key: string]: unknown;
};

/** Resultado de handle***REMOVED***Amount: {} si fue bien, { error } si falló. */
export type ***REMOVED***Result = { error: string } | {};

/** Lo que ***REMOVED***Amount necesita de su orquestador (***REMOVED***Module). */
export interface ***REMOVED***Info {
  ***REMOVED***: ***REMOVED***;
  params: ***REMOVED***Params;
  handle***REMOVED***Amount: (data: Record<string, unknown>) => Promise<***REMOVED***Result>;
}

/**
 * Validación propia del ejemplo: el monto debe ser un número dentro de un
 * rango. Se agrega al campo base con addValidator (patrón proxy).
 */
const Between = (
  min: number,
  max: number,
  tipo: string,
): Validator => ({
  validate: (value) => {
    const num = parseFloat(value);
    if (!value || Number.isNaN(num)) return "Ingresa un monto válido";
    if (num < min) return "El monto debe ser superior a " + min + " " + tipo;
    if (num > max) return "El monto debe ser inferior a " + max + " " + tipo;
    return null;
  },
});

/**
 * Formulario de monto. `info` es la instancia de ***REMOVED***Module e
 * implementa: info.***REMOVED***, info.params, info.handle***REMOVED***Amount.
 */
export const ***REMOVED***Amount = (info: ***REMOVED***Info) => {
  const { div } = van.tags;

  const msg = van.state<Element | null>(null);
  const formError = van.state("");

  const params = info.params;
  const ***REMOVED*** = info.***REMOVED***;

  const amount = Field({ label: "Monto a ***REMOVED***r (" + params.tipo + ")", name: "amount", inputType: "number" });
  amount.addValidator(
    Between(
      parseFloat(params.monto_min_***REMOVED***),
      parseFloat(params.monto_max_***REMOVED***),
      params.tipo,
    ),
  );

  const form = Form(async (data) => {
    formError.val = "";
    msg.val = Spin("Generando ***REMOVED***...");
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
          "Mínimo: " +
            params.monto_min_***REMOVED*** +
            " " +
            params.tipo +
            ", Máximo: " +
            params.monto_max_***REMOVED*** +
            " " +
            params.tipo,
        ),
        div(
          { class: "pt-4" },
          () => (msg.val && msg.val) || PrimaryButton({ type: "submit" }, "***REMOVED***r"),
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
  title: "***REMOVED***r con " + info.***REMOVED***.id,
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
        "Haz clic aquí para abrir la plataforma",
      ),
      div(
        { class: "text-muted text-sm italic" },
        "o escanea el código QR con tu app móvil",
      ),
      img({
        class: "mx-auto",
        src: qr,
        alt: "Código QR para ***REMOVED***r",
      }),
      div(
        { class: "text-muted text-sm italic" },
        "Tu saldo se actualizará automáticamente.",
      ),
    ),
  );
};

export const ***REMOVED***QrModal = (qr: string, url: string): ModalContent => ({
  body: () => ***REMOVED***Qr(qr, url),
});
