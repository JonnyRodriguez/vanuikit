import van, { type ValidChildDomValue, type State } from "vanjs-core";
import { SecondaryButton } from "./button.js";
import { t } from "../i18n.js";

/**
 * Content of a modal zone: a function returning a VanJS child
 * (re-evaluated on each render, useful for reactive content), or null
 * to hide the zone.
 */
export type ModalZone = (() => ValidChildDomValue) | null;

/** Contract for set() / initialContent: any of the zones, optional. */
export type ModalContent = {
  header?: ModalZone | ValidChildDomValue;
  body?: ModalZone | ValidChildDomValue;
  footer?: ModalZone | ValidChildDomValue;
};

/**
 * Normalizes a zone: accepts functions (reactive), direct nodes/text or
 * null/undefined (hidden zone).
 */
const zone = (v: unknown): ModalZone => {
  if (v === null || v === undefined) return null;
  return typeof v === "function" ? (v as ModalZone) : () => v as ValidChildDomValue;
};

/** Modal width variants. Default is `md`. */
export type ModalSize = "sm" | "md" | "lg" | "xl";

const MODAL_SIZES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * ModalBase — the most basic brick: overlay + three zones (header, body,
 * footer) filled with set() or the individual setters.
 */
export const ModalBase = (
  initialContent: ModalContent | null = null,
  initialVisible = false,
  size: ModalSize = "md",
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

  /** Fills by parts: set({ header, body, footer }, open). */
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
          class: `bg-background rounded-lg shadow-xl p-6 w-full ${MODAL_SIZES[size]}`,
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
// Modal — composed: ModalBase + title, close button and footer
// ---------------------------------------------------------------

export const ModalTitle = (title: string | State<string>) =>
  van.tags.div({ class: "text-xl font-bold text-accent" }, title);

export const ModalClose = (onClose: () => void) =>
  van.tags.button(
    {
      type: "button",
      class:
        "text-2xl text-muted hover:text-foreground-soft bg-transparent border-none cursor-pointer p-0",
      "aria-label": t("modal.close", "Close"),
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
  text: string | State<string> = t("modal.close", "Close"),
) =>
  van.tags.div(
    { class: "pt-3 flex justify-end gap-2" },
    SecondaryButton({ onclick: onClose }, text),
  );

export type ModalProps = ModalContent & { title?: string | State<string> };

/**
 * Convenience Modal — built on ModalBase: already ships a header with title +
 * close button and a footer with the default "Close".
 *
 *   const modal = Modal();
 *   modal.mount();
 *   modal.set({ title: "Hello", body: "World" }, true); // opens
 *   modal.close();
 *
 * The footer can be overridden by passing `footer` to set() (or null to
 * remove it, e.g. in a loading modal).
 */
export const Modal = (
  initialContent: ModalProps | null = null,
  initialVisible = false,
  size: ModalSize = "md",
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
    size,
  );

  const setTitle = (newTitle: string | State<string>) => (title.val = newTitle);

  // Same as ModalBase.set but without mutating the caller's object:
  // completes the default footer on a copy if none was defined.
  const set = (input: ModalProps, show = false) => {
    const next: ModalContent = { ...input };
    if (!("footer" in next)) next.footer = footer;
    if (input.title !== undefined) setTitle(input.title);
    modal.set(next, show);
  };

  return { ...modal, setTitle, set };
};
