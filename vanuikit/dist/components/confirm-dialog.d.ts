import { type State, type ValidChildDomValue } from "vanjs-core";
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
export declare function ConfirmDialog(props: ConfirmDialogProps): {
    setTitle: (newTitle: string | State<string>) => string | State<string>;
    set: (input: import("./modal.js").ModalProps, show?: boolean) => void;
    open: () => boolean;
    close: () => boolean;
    setHeader: (newHeader?: import("./modal.js").ModalZone | ValidChildDomValue) => import("./modal.js").ModalZone;
    setBody: (newBody?: import("./modal.js").ModalZone | ValidChildDomValue) => import("./modal.js").ModalZone;
    setFooter: (newFooter?: import("./modal.js").ModalZone | ValidChildDomValue) => import("./modal.js").ModalZone;
    mount: (container?: HTMLElement) => HTMLDivElement;
    isVisible: State<boolean>;
    render: () => HTMLDivElement;
    dom: () => HTMLDivElement;
};
export declare function confirmDialog(options: ConfirmDialogProps): Promise<boolean>;
//# sourceMappingURL=confirm-dialog.d.ts.map