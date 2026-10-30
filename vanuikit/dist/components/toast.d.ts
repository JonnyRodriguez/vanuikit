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
declare class ToastManager {
    private items;
    private containerMounted;
    private ensureContainer;
    private renderToast;
    show(type: ToastType, message: string, options?: ToastOptions): string;
    info(message: string, options?: ToastOptions): string;
    success(message: string, options?: ToastOptions): string;
    warning(message: string, options?: ToastOptions): string;
    error(message: string, options?: ToastOptions): string;
    remove(id: string): void;
    clear(): void;
}
export declare const toast: ToastManager;
export {};
//# sourceMappingURL=toast.d.ts.map