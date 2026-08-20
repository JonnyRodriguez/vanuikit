/**
 * Referencia — orquestación de un flujo completo con la librería:
 * lista de pasarelas -> modal de monto -> modal de QR.
 * `element` puede ser un id (string) o un elemento DOM.
 */
import { van } from "vanui";
import { Modal } from "vanui";
import { GatewaysList, type Gateway } from "./gateways.js";
import {
  RechargeAmountModal,
  RechargeQrModal,
  type RechargeParams,
  type RecargaResult,
} from "./recharge.js";
import { QRGenerator } from "./qr.js";

export type RechargeModuleOptions = {
  /** Endpoint POST que genera la recarga. Sin él, el flujo devuelve un error. */
  endpoint?: string;
};

export class RechargeModule {
  gateways: Gateway[];
  params: RechargeParams;
  gateway: Gateway | null = null;
  qr = new QRGenerator();
  modal = Modal();
  element: string | HTMLElement | null = null;
  endpoint?: string;

  constructor(
    gateways: Gateway[],
    params: RechargeParams,
    element: string | HTMLElement | null = null,
    options: RechargeModuleOptions = {},
  ) {
    this.gateways = gateways;
    this.params = params;
    this.endpoint = options.endpoint;
    this.modal.mount();
    if (element) this.mount(element);
  }

  handleGatewaySelect = (gateway: Gateway) => {
    if (typeof gateway.url === "string") {
      window.location.href = gateway.url;
      return;
    }
    this.gateway = gateway;
    this.modal.set(RechargeAmountModal({ ...this, gateway }), true);
  };

  handleRechargeAmount = async (
    data: Record<string, any>,
  ): Promise<RecargaResult> => {
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
        return { error: result.error || "No se pudo generar la recarga" };
      }

      const url = result.data?.url;
      if (!url) return { error: "No se pudo generar la recarga" };

      const qr = await this.qr.generate(
        url,
        data.gateway.img,
      );
      if ("error" in qr) return { error: "No se pudo generar el código QR" };

      this.modal.set(RechargeQrModal(qr.qr, url));
      return {};
    } catch (err) {
      console.error("Error al generar la recarga:", err);
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
        throw new Error("RechargeModule: no se encontró el contenedor");
      van.add(
        target,
        GatewaysList(this.gateways, this.handleGatewaySelect),
      );
    }
  };
}
