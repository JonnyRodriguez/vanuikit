import van, { type State, type ChildDom } from "vanjs-core";
import { Button } from "./button.js";
import { Spin } from "./spin.js";

const { div, h3, p, span } = van.tags;

export type ConfirmVariant = "primary" | "danger" | "warning";

export interface ConfirmDialogProps {
  id?: string;
  title?: string | State<string>;
  message: string | ChildDom | (() => ChildDom);
  confirmText?: string | State<string>;
  cancelText?: string | State<string>;
  variant?: ConfirmVariant;
  icon?: ChildDom;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  isOpen?: State<boolean>;
}

/**
 * Componente ConfirmDialog declarativo.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const isVisible = props.isOpen ?? van.state(false);
  const isLoading = van.state(false);
  const variant = props.variant ?? "primary";

  const close = () => {
    if (isLoading.val) return;
    isVisible.val = false;
    props.onCancel?.();
  };

  const handleConfirm = async () => {
    if (props.onConfirm) {
      try {
        isLoading.val = true;
        await props.onConfirm();
      } finally {
        isLoading.val = false;
        isVisible.val = false;
      }
    } else {
      isVisible.val = false;
    }
  };

  const getVariantIcon = () => {
    if (props.icon) return props.icon;
    switch (variant) {
      case "danger":
        return span(
          {
            class:
              "w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center text-lg font-bold shrink-0",
          },
          "⚠️",
        );
      case "warning":
        return span(
          {
            class:
              "w-10 h-10 rounded-full bg-yellow-500/15 text-yellow-500 flex items-center justify-center text-lg font-bold shrink-0",
          },
          "🔔",
        );
      case "primary":
      default:
        return span(
          {
            class:
              "w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-bold shrink-0",
          },
          "❓",
        );
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case "danger":
        return "destructive";
      case "primary":
      default:
        return "primary";
    }
  };

  const render = () =>
    div(
      {
        id: props.id,
        class: () =>
          isVisible.val
            ? "fixed inset-0 flex items-center justify-center bg-overlay z-50 p-4 transition-all duration-200"
            : "hidden",
        role: "alertdialog",
        "aria-modal": "true",
        onclick: (e: MouseEvent) => e.target === e.currentTarget && close(),
      },
      div(
        {
          class:
            "bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-150",
          onclick: (e: MouseEvent) => e.stopPropagation(),
        },
        // Header con Icono + Título
        div(
          { class: "flex items-start gap-3.5" },
          getVariantIcon(),
          div(
            { class: "flex-1" },
            h3(
              { class: "text-lg font-bold text-foreground m-0" },
              props.title ?? "Confirmar acción",
            ),
            div(
              { class: "text-sm text-foreground-soft mt-1 leading-relaxed" },
              typeof props.message === "function"
                ? (props.message as () => ChildDom)()
                : typeof props.message === "string"
                ? p({ class: "m-0" }, props.message)
                : props.message,
            ),
          ),
        ),
        // Acciones / Footer
        div(
          { class: "mt-6 flex items-center justify-end gap-2.5 pt-2" },
          Button(
            {
              variant: "secondary",
              disabled: () => isLoading.val,
              onclick: close,
            },
            props.cancelText ?? "Cancelar",
          ),
          () =>
            isLoading.val
              ? Spin("Procesando...")
              : Button(
                  {
                    variant: getConfirmButtonVariant(),
                    onclick: handleConfirm,
                  },
                  props.confirmText ?? "Confirmar",
                ),
        ),
      ),
    );

  return {
    open: () => (isVisible.val = true),
    close,
    isVisible,
    dom: render,
  };
}

/**
 * Función imperativa confirmDialog: lanza una ventana de confirmación y retorna una Promise<boolean>.
 *
 *   const confirmed = await confirmDialog({
 *     title: "¿Eliminar registro?",
 *     message: "Esta acción no se puede deshacer.",
 *     variant: "danger",
 *     confirmText: "Eliminar",
 *   });
 */
export function confirmDialog(options: {
  title?: string;
  message: string | ChildDom;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: ChildDom;
}): Promise<boolean> {
  return new Promise((resolve) => {
    const isVisible = van.state(true);

    const dialog = ConfirmDialog({
      ...options,
      isOpen: isVisible,
      onConfirm: () => {
        resolve(true);
      },
      onCancel: () => {
        resolve(false);
      },
    });

    const el = dialog.dom();
    document.body.appendChild(el);

    // Limpieza al cerrar
    const observer = () => {
      if (!isVisible.val) {
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 200);
      }
    };
    van.derive(observer);
  });
}
