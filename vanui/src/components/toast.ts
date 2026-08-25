import van from "vanjs-core";

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
  private containerMounted = false;

  private ensureContainer() {
    if (this.containerMounted || typeof document === "undefined") return;
    this.containerMounted = true;

    const containerEl = div(
      {
        id: "vanui-toast-container",
        class: "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0",
      },
      () =>
        div(
          { class: "flex flex-col gap-2 w-full" },
          this.items.val.map((item) => this.renderToast(item)),
        ),
    );

    if (document.body) {
      document.body.appendChild(containerEl);
    } else {
      window.addEventListener("DOMContentLoaded", () => {
        document.body.appendChild(containerEl);
      });
    }
  }

  private renderToast(item: ToastItem) {
    const bgStyles: Record<ToastType, string> = {
      info: "bg-blue-900/90 border-blue-600/50 text-blue-100",
      success: "bg-emerald-900/90 border-emerald-600/50 text-emerald-100",
      warning: "bg-amber-900/90 border-amber-600/50 text-amber-100",
      error: "bg-rose-900/90 border-rose-600/50 text-rose-100",
    };

    const iconSymbols: Record<ToastType, string> = {
      info: "ℹ",
      success: "✓",
      warning: "⚠",
      error: "✕",
    };

    return div(
      {
        id: `toast-${item.id}`,
        class: `pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur shadow-xl transition-all ${bgStyles[item.type]}`,
      },
      span(
        {
          class:
            "flex items-center justify-center w-6 h-6 rounded-full bg-white/10 font-bold text-xs shrink-0 mt-0.5",
        },
        iconSymbols[item.type],
      ),
      div(
        { class: "flex-1 min-w-0" },
        item.title
          ? div({ class: "font-semibold text-sm leading-tight text-white mb-0.5" }, item.title)
          : null,
        div({ class: "text-xs opacity-90 leading-relaxed break-words" }, item.message),
      ),
      button(
        {
          type: "button",
          class:
            "text-white/60 hover:text-white p-1 text-xs rounded transition-colors shrink-0 -mr-1 -mt-1",
          onclick: () => this.remove(item.id),
        },
        "✕",
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
