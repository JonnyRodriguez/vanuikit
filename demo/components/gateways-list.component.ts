// demo/components/gateways-list.component.ts
/**
 * GatewaysList Component — Selección visual de pasarelas de pago.
 */
import { van } from "vanui";
import type { Gateway } from "../shared/payment.schema.js";

export type OnSelectGateway = (gateway: Gateway) => void;

export const GatewayItem = (gateway: Gateway, selected = false) => {
  const { div, img, span } = van.tags;
  return div(
    { class: "relative flex flex-col items-center justify-center w-full h-full" },
    selected
      ? span(
          {
            class:
              "absolute -top-1 -right-1 flex items-center justify-center " +
              "h-5 w-5 rounded-full bg-accent text-background text-xs font-bold",
          },
          "✓",
        )
      : "",
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
  selected = false,
) => {
  const { div, button } = van.tags;

  return div(
    { class: "w-9/10 max-w-75 lg:w-1/5 lg:min-w-30 box-border text-center" },
    button(
      {
        class:
          "w-full h-20 p-2 rounded-lg border transition-all duration-300 cursor-pointer " +
          "shadow-sm hover:shadow-lg hover:translate-y-0.5 " +
          (selected
            ? "border-accent bg-accent/10 ring-2 ring-accent/40"
            : "bg-background border-border hover:border-accent"),
        type: "button",
        onclick: () => onSelectGateway(gateway),
      },
      GatewayItem(gateway, selected),
    ),
  );
};

export const GatewaysList = (
  gateways: Gateway[],
  onSelectGateway: OnSelectGateway,
  selectedId: string | null = null,
) => {
  const { div } = van.tags;

  return div(
    { class: "flex flex-wrap justify-center gap-4 p-2" },
    gateways.map((gateway) =>
      GatewayButton(gateway, onSelectGateway, gateway.id === selectedId),
    ),
  );
};
