// demo/components/gateways-list.component.ts
/**
 * GatewaysList Component — Selección visual de pasarelas de pago.
 */
import { van } from "vanui";
import type { Gateway } from "../shared/payment.schema.js";

export type OnSelectGateway = (gateway: Gateway) => void;

export const GatewayItem = (gateway: Gateway) => {
  const { div, img, span } = van.tags;
  return div(
    { class: "flex flex-col items-center justify-center w-full h-full" },
    img({
      class: "max-h-10 w-full mb-1 filter brightness-105",
      src: gateway.img,
    }),
    span(
      { class: "text-xs font-bold text-foreground-soft leading-none" },
      gateway.name,
    ),
  );
};

export const GatewayButton = (
  gateway: Gateway,
  onSelectGateway: OnSelectGateway,
) => {
  const { div, button } = van.tags;

  return div(
    { class: "w-9/10 max-w-75 lg:w-1/5 lg:min-w-30 box-border text-center" },
    button(
      {
        class:
          "w-full h-20 p-2 bg-background border border-border rounded-lg" +
          " shadow-sm transition-all duration-300 cursor-pointer" +
          " hover:shadow-lg hover:translate-y-0.5 hover:border-accent",
        type: "button",
        onclick: () => onSelectGateway(gateway),
      },
      GatewayItem(gateway),
    ),
  );
};

export const GatewaysList = (
  gateways: Gateway[],
  onSelectGateway: OnSelectGateway,
) => {
  const { div } = van.tags;

  return div(
    { class: "flex flex-wrap justify-center gap-4 p-2" },
    gateways.map((gateway) =>
      GatewayButton(gateway, onSelectGateway),
    ),
  );
};
