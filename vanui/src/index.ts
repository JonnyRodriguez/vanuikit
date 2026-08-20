/**
 * API pública de la librería. Importa desde aquí:
 *   import { Modal, Field, PrimaryButton } from "vanui";
 *
 * Estructura:
 *   components/  — componentes de simple a complejo (Button -> Modal)
 *   screens/     — pantallas de ejemplo (composición de componentes)
 *   router.ts    — base de SPA: navegación con params, guards y redirects
 *   auth.ts      — base de sesión: createAuth + requireAuth
 */
export { default as van } from "vanjs-core";

// utilidades compartidas
export { cx } from "./util.js";

// base de desarrollo SPA (sin frameworks externos)
export { Router } from "./router.js";
export { createAuth, requireAuth } from "./auth.js";
export type {
  RouteParams,
  RouteContext,
  Guard,
  RouteOptions,
  RouteFactory,
} from "./router.js";
export type { AuthApi, AuthState, AuthStatus, AuthUser } from "./auth.js";

// componentes — de simple a complejo
export {
  Button,
  PrimaryButton,
  SecondaryButton,
} from "./components/button.js";
export {
  Input,
  Select,
  Textarea,
  Label,
  Field,
  TextField,
  EmailField,
  PasswordField,
} from "./components/field.js";
export { Form } from "./components/form.js";
export {
  ModalBase,
  ModalTitle,
  ModalClose,
  ModalHeaderWithTitleAndClose,
  ModalFooterWithCloseButton,
  Modal,
} from "./components/modal.js";
export { Spin } from "./components/spin.js";
export { SpinModal } from "./components/spin-modal.js";
export { Nav } from "./components/nav.js";

// validadores de campos (se componen en los campos tipados)
export { Required, Email, MinLength, Match, type Validator } from "./validators.js";

// screens públicas: login y register (formularios reutilizables)
export { LoginForm } from "./screens/login.js";
export { RegisterForm } from "./screens/register.js";

// tipos de los contratos
export type { ModalZone, ModalContent, ModalProps } from "./components/modal.js";
export type { NavLink } from "./components/nav.js";
export type { AuthResult, LoginInfo } from "./screens/login.js";
export type { RegisterInfo } from "./screens/register.js";

// NOTA: el flujo de recarga (gateways, qr, recharge, recharge-module) NO es
// parte de la librería: es el ejemplo de partida, vive en la demo
// (../demo/screens/) y se consume solo desde ella. No se exporta desde aquí.
