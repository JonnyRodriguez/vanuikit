import { Spin } from "./spin.js";
import type { ModalContent } from "./modal.js";

/** Modal content with spinner: hides the default "Close" footer. */
export const SpinModal = (msg: string): ModalContent => ({
  body: () => Spin(msg),
  footer: null,
});
