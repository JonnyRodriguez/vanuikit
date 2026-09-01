import van, { type ValidChildDomValue, type State } from "vanjs-core";
import { SecondaryButton } from "./button.js";
import { t } from "../i18n.js";

/**
 * =========================================================================
 * DEFINICIÓN LOCAL DE TEXTOS (TEXTS)
 * =========================================================================
 */
export const TEXTS = {
  close: { key: "modal.close", default: "Cerrar" },
};

/**
 * Contenido de una zona del modal: función que devuelve un hijo de VanJS
 * (se re-evalúa en cada render, sirve para contenido reactivo), o null
 * para ocultar la zona.
 */
export type ModalZone = (() => ValidChildDomValue) | null;

/** Contrato de set() / initialContent: cualquiera de las zonas, opcional. */
export type ModalContent = {
  header?: ModalZone | ValidChildDomValue;
  body?: ModalZone | ValidChildDomValue;
  footer?: ModalZone | ValidChildDomValue;
};

/**
 * Normaliza una zona: acepta funciones (reactivas), nodos/textos directos o
 * null/undefined (zona oculta).
 */
const zone = (v: unknown): ModalZone => {
  if (v === null || v === undefined) return null;
  return typeof v === "function" ? (v as ModalZone) : () => v as ValidChildDomValue;
};

/**
 * ModalBase — el ladrillo más básico: overlay + tres zonas (header, body,
 * footer) que se llenan con set() o con los setters individuales.
 */
export const ModalBase = (
  initialContent: ModalContent | null = null,
  initialVisible = false,
) => {
  const header = van.state<ModalZone>(null);
  const body = van.state<ModalZone>(null);
  const footer = van.state<ModalZone>(null);
  const isVisible = van.state(initialVisible);

  const setHeader = (newHeader: ModalZone | ValidChildDomValue = null) =>
    (header.val = zone(newHeader));
  const setBody = (newBody: ModalZone | ValidChildDomValue = null) =>
    (body.val = zone(newBody));
  const setFooter = (newFooter: ModalZone | ValidChildDomValue = null) =>
    (footer.val = zone(newFooter));

  const open = () => (isVisible.val = true);
  const close = () => (isVisible.val = false);

  /** Rellena por partes: set({ header, body, footer }, abrir). */
  const set = (input: ModalContent, show = false) => {
    if ("header" in input) setHeader(input.header);
    if ("body" in input) setBody(input.body);
    if ("footer" in input) setFooter(input.footer);
    if (show) open();
  };

  if (initialContent) set(initialContent);

  const div = van.tags.div;

  const render = () =>
    div(
      {
        class: () =>
          isVisible.val
            ? "fixed inset-0 flex items-center justify-center bg-overlay z-50 p-4"
            : "hidden",
        role: "dialog",
        "aria-modal": "true",
        onclick: (e: MouseEvent) => e.target === e.currentTarget && close(),
      },
      div(
        {
          class: "bg-background rounded-lg shadow-xl p-6 w-full max-w-md",
          onclick: (e: MouseEvent) => e.stopPropagation(),
        },
        () => (header.val ? header.val() : div()),
        () => (body.val ? body.val() : div()),
        () => (footer.val ? footer.val() : div()),
      ),
    );

  const mount = (container = document.body) => container.appendChild(render());

  return {
    open,
    close,
    setHeader,
    setBody,
    setFooter,
    set,
    mount,
    isVisible,
    render,
    dom: render,
  };
};

// ---------------------------------------------------------------
// Modal — compuesto: ModalBase + título, botón de cierre y footer
// ---------------------------------------------------------------

export const ModalTitle = (title: string | State<string>) =>
  van.tags.div({ class: "text-xl font-bold text-accent" }, title);

export const ModalClose = (onClose: () => void) =>
  van.tags.button(
    {
      type: "button",
      class:
        "text-2xl text-muted hover:text-foreground-soft bg-transparent border-none cursor-pointer p-0",
      "aria-label": t(TEXTS.close.key, undefined, TEXTS.close.default),
      onclick: onClose,
    },
    "×",
  );

export const ModalHeaderWithTitleAndClose = (
  title: string | State<string>,
  onClose: () => void,
) =>
  van.tags.div(
    { class: "flex justify-between items-center pb-3" },
    ModalTitle(title),
    ModalClose(onClose),
  );

export const ModalFooterWithCloseButton = (
  onClose: () => void,
  text: string | State<string> = t(TEXTS.close.key, undefined, TEXTS.close.default),
) =>
  van.tags.div(
    { class: "pt-3 flex justify-end gap-2" },
    SecondaryButton({ onclick: onClose }, text),
  );

export type ModalProps = ModalContent & { title?: string | State<string> };

/**
 * Modal cómodo — construido sobre ModalBase: ya trae header con título +
 * botón de cierre y un footer con "Cerrar" por defecto.
 *
 *   const modal = Modal();
 *   modal.mount();
 *   modal.set({ title: "Hola", body: "Mundo" }, true); // abre
 *   modal.close();
 *
 * Se puede sobreescribir el footer pasando `footer` en set() (o null para
 * quitarlo, por ejemplo en un modal de carga).
 */
export const Modal = (
  initialContent: ModalProps | null = null,
  initialVisible = false,
) => {
  const title = van.state<string | State<string> | undefined>(
    initialContent?.title,
  );
  const header = () =>
    ModalHeaderWithTitleAndClose(title.val ?? "", () => modal.close());
  const footer = () => ModalFooterWithCloseButton(() => modal.close());

  const modal = ModalBase(
    {
      header: initialContent?.header ?? header,
      footer: initialContent?.footer !== undefined ? initialContent.footer : footer,
      body: initialContent?.body,
    },
    initialVisible,
  );

  const setTitle = (newTitle: string | State<string>) => (title.val = newTitle);

  // Igual que ModalBase.set pero sin mutar el objeto del llamador:
  // completa el footer por defecto en una copia si no se definió.
  const set = (input: ModalProps, show = false) => {
    const next: ModalContent = { ...input };
    if (!("footer" in next)) next.footer = footer;
    if (input.title !== undefined) setTitle(input.title);
    modal.set(next, show);
  };

  return { ...modal, setTitle, set };
};
