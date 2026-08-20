/**
 * Referencia — orquestación de un flujo completo con la librería:
 * lista de ***REMOVED***s -> modal de monto -> modal de QR.
 * `element` puede ser un id (string) o un elemento DOM.
 */
import { van } from "vanui";
import { Modal } from "vanui";
import { ***REMOVED***List, type ***REMOVED*** } from "./***REMOVED***.js";
import {
  ***REMOVED***AmountModal,
  ***REMOVED***QrModal,
  type ***REMOVED***Params,
  type ***REMOVED***Result,
} from "./***REMOVED***.js";
import { QRGenerator } from "./qr.js";

export type ***REMOVED***ModuleOptions = {
  /** Endpoint POST que genera la ***REMOVED***. Sin él, el flujo devuelve un error. */
  endpoint?: string;
};

export class ***REMOVED***Module {
  ***REMOVED***: ***REMOVED***[];
  params: ***REMOVED***Params;
  ***REMOVED***: ***REMOVED*** | null = null;
  qr = new QRGenerator();
  modal = Modal();
  element: string | HTMLElement | null = null;
  endpoint?: string;

  constructor(
    ***REMOVED***: ***REMOVED***[],
    params: ***REMOVED***Params,
    element: string | HTMLElement | null = null,
    options: ***REMOVED***ModuleOptions = {},
  ) {
    this.***REMOVED*** = ***REMOVED***;
    this.params = params;
    this.endpoint = options.endpoint;
    this.modal.mount();
    if (element) this.mount(element);
  }

  handle***REMOVED***Select = (***REMOVED***: ***REMOVED***) => {
    if (typeof ***REMOVED***.url === "string") {
      window.location.href = ***REMOVED***.url;
      return;
    }
    this.***REMOVED*** = ***REMOVED***;
    this.modal.set(***REMOVED***AmountModal({ ...this, ***REMOVED*** }), true);
  };

  handle***REMOVED***Amount = async (
    data: Record<string, any>,
  ): Promise<***REMOVED***Result> => {
    if (!this.endpoint) return { error: "Endpoint no configurado" };

    const fetchOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    try {
      const res = await fetch(this.endpoint, fetchOptions);
      const result = await res.json();

      // Backend Hono devuelve: { error: "..." } (400) | { status: "ok", data: { url } } (200)
      if (!res.ok || result.error) {
        return { error: result.error || "No se pudo generar la ***REMOVED***" };
      }

      const url = result.data?.url;
      if (!url) return { error: "No se pudo generar la ***REMOVED***" };

      const qr = await this.qr.generate(
        url,
        data.***REMOVED***.img,
      );
      if ("error" in qr) return { error: "No se pudo generar el código QR" };

      this.modal.set(***REMOVED***QrModal(qr.qr, url));
      return {};
    } catch (err) {
      console.error("Error al generar la ***REMOVED***:", err);
      return { error: "Error de conexión, intenta de nuevo" };
    }
  };

  mount = (element: string | HTMLElement | null) => {
    if (element) {
      this.element = element;
      const target =
        typeof element === "string"
          ? document.getElementById(element)
          : element;
      if (!target)
        throw new Error("***REMOVED***Module: no se encontró el contenedor");
      van.add(
        target,
        ***REMOVED***List(this.***REMOVED***, this.handle***REMOVED***Select),
      );
    }
  };
}
