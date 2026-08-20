import { Spin } from "./spin.js";
import type { ModalContent } from "./modal.js";

/** Contenido de modal con spinner: oculta el footer "Cerrar". */
export const SpinModal = (msg: string): ModalContent => ({
  body: () => Spin(msg),
  footer: null,
});
