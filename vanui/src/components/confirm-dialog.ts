import van, { type State, type ValidChildDomValue } from "vanjs-core";
import { Modal } from "./modal.js";
import { PrimaryButton, SecondaryButton, Button } from "./button.js";
import { t } from "../i18n.js";

const { div, p, span } = van.tags;

export type ConfirmVariant = "primary" | "danger" | "warning";

export interface ConfirmDialogProps {
  title?: string | State<string>;
  message: string | ValidChildDomValue | (() => ValidChildDomValue);
  confirmText?: string | State<string>;
  cancelText?: string | State<string>;
  variant?: ConfirmVariant;
  icon?: ValidChildDomValue;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const variant = props.variant ?? "primary";

  const confirmBtn = () => {
    const text = props.confirmText ?? t("dialog.confirm", "Confirmar");
    const onclick = () => {
      modal.close();
      props.onConfirm?.();
    };
    if (variant === "danger") return Button({ variant: "destructive", onclick }, text);
    return PrimaryButton({ onclick }, text);
  };

  const body = () =>
    div(
      { class: "flex items-start gap-3.5 py-1" },
      props.icon ??
        span(
          { class: "text-xl shrink-0" },
          variant === "danger" ? "⚠️" : variant === "warning" ? "🔔" : "❓",
        ),
      div(
        { class: "flex-1 text-sm text-foreground-soft leading-relaxed" },
        typeof props.message === "function"
          ? props.message()
          : typeof props.message === "string"
            ? p({ class: "m-0" }, props.message)
            : props.message,
      ),
    );

  const footer = () =>
    div(
      { class: "pt-4 flex items-center justify-end gap-2.5" },
      SecondaryButton(
        {
          onclick: () => {
            modal.close();
            props.onCancel?.();
          },
        },
        props.cancelText ?? t("dialog.cancel", "Cancelar"),
      ),
      confirmBtn(),
    );

  const modal = Modal({
    title: props.title ?? t("dialog.confirmTitle", "Confirmar acción"),
    body,
    footer,
  });

  return modal;
}

export function confirmDialog(options: ConfirmDialogProps): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = ConfirmDialog({
      ...options,
      onConfirm: () => {
        options.onConfirm?.();
        resolve(true);
      },
      onCancel: () => {
        options.onCancel?.();
        resolve(false);
      },
    });
    dialog.mount();
    dialog.open();
  });
}
