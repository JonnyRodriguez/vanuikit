import van from "vanjs-core";
import { Icon, type IconName } from "./icon.js";

const { div, span, button } = van.tags;

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

export interface ToastOptions {
  title?: string;
  durationMs?: number;
}

class ToastManager {
  private items = van.state<ToastItem[]>([]);
  private containerEl: HTMLElement | null = null;

  private ensureContainer() {
    if (typeof document === "undefined") return;
    // Re-adjunta si algo reemplazó el <body> y el contenedor quedó detached
    // (suites con happy-dom que hacen replaceChildren, HMR, …).
    if (this.containerEl?.isConnected) return;

    const containerEl = div(
      {
        id: "vanuikit-toast-container",
        class: "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0",
      },
      () =>
        div(
          { class: "flex flex-col gap-2 w-full" },
          this.items.val.map((item) => this.renderToast(item)),
        ),
    );
    this.containerEl = containerEl;

    if (document.body) {
      document.body.appendChild(containerEl);
    } else {
      window.addEventListener("DOMContentLoaded", () => {
        document.body.appendChild(containerEl);
      });
    }
  }

  private renderToast(item: ToastItem) {
    /** Toast neutro sobre la superficie del tema con ícono en el color del
     *  estado (patrón sonner/shadcn): legible y re-themable en ambos modos. */
    const iconColors: Record<ToastType, string> = {
      info: "text-info-fg",
      success: "text-success-fg",
      warning: "text-warning-fg",
      error: "text-destructive-fg",
    };

    const iconNames: Record<ToastType, IconName> = {
      info: "info",
      success: "check",
      warning: "alert-triangle",
      error: "x",
    };

    return div(
      {
        id: `toast-${item.id}`,
        class:
          "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card text-foreground backdrop-blur shadow-xl transition-all",
      },
      span(
        {
          class:
            "flex items-center justify-center w-6 h-6 rounded-full bg-foreground/10 shrink-0 mt-0.5",
        },
        Icon({ name: iconNames[item.type], class: `size-3.5 ${iconColors[item.type]}` }),
      ),
      div(
        { class: "flex-1 min-w-0" },
        item.title
          ? div({ class: "font-semibold text-sm leading-tight text-foreground mb-0.5" }, item.title)
          : null,
        div({ class: "text-xs text-foreground-soft leading-relaxed break-words" }, item.message),
      ),
      button(
        {
          type: "button",
          class:
            "text-muted hover:text-foreground p-1 text-xs rounded transition-colors shrink-0 -mr-1 -mt-1",
          onclick: () => this.remove(item.id),
        },
        Icon({ name: "x", class: "size-3.5" }),
      ),
    );
  }

  show(type: ToastType, message: string, options?: ToastOptions): string {
    this.ensureContainer();
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duration = options?.durationMs ?? 4000;

    const newItem: ToastItem = {
      id,
      type,
      message,
      title: options?.title,
      durationMs: duration,
    };

    this.items.val = [...this.items.val, newItem];

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  info(message: string, options?: ToastOptions) {
    return this.show("info", message, options);
  }

  success(message: string, options?: ToastOptions) {
    return this.show("success", message, options);
  }

  warning(message: string, options?: ToastOptions) {
    return this.show("warning", message, options);
  }

  error(message: string, options?: ToastOptions) {
    return this.show("error", message, options);
  }

  remove(id: string) {
    this.items.val = this.items.val.filter((item) => item.id !== id);
  }

  clear() {
    this.items.val = [];
  }
}

export const toast = new ToastManager();
