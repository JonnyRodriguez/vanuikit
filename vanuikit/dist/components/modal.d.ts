import { type ValidChildDomValue, type State } from "vanjs-core";
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
 * ModalBase — el ladrillo más básico: overlay + tres zonas (header, body,
 * footer) que se llenan con set() o con los setters individuales.
 */
export declare const ModalBase: (initialContent?: ModalContent | null, initialVisible?: boolean) => {
    open: () => boolean;
    close: () => boolean;
    setHeader: (newHeader?: ModalZone | ValidChildDomValue) => ModalZone;
    setBody: (newBody?: ModalZone | ValidChildDomValue) => ModalZone;
    setFooter: (newFooter?: ModalZone | ValidChildDomValue) => ModalZone;
    set: (input: ModalContent, show?: boolean) => void;
    mount: (container?: HTMLElement) => HTMLDivElement;
    isVisible: State<boolean>;
    render: () => HTMLDivElement;
    dom: () => HTMLDivElement;
};
export declare const ModalTitle: (title: string | State<string>) => HTMLDivElement;
export declare const ModalClose: (onClose: () => void) => HTMLButtonElement;
export declare const ModalHeaderWithTitleAndClose: (title: string | State<string>, onClose: () => void) => HTMLDivElement;
export declare const ModalFooterWithCloseButton: (onClose: () => void, text?: string | State<string>) => HTMLDivElement;
export type ModalProps = ModalContent & {
    title?: string | State<string>;
};
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
export declare const Modal: (initialContent?: ModalProps | null, initialVisible?: boolean) => {
    setTitle: (newTitle: string | State<string>) => string | State<string>;
    set: (input: ModalProps, show?: boolean) => void;
    open: () => boolean;
    close: () => boolean;
    setHeader: (newHeader?: ModalZone | ValidChildDomValue) => ModalZone;
    setBody: (newBody?: ModalZone | ValidChildDomValue) => ModalZone;
    setFooter: (newFooter?: ModalZone | ValidChildDomValue) => ModalZone;
    mount: (container?: HTMLElement) => HTMLDivElement;
    isVisible: State<boolean>;
    render: () => HTMLDivElement;
    dom: () => HTMLDivElement;
};
//# sourceMappingURL=modal.d.ts.map