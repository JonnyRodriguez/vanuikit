// vanui/src/index.ts
/**
 * VanUI — Biblioteca de componentes modulares y reactivos para VanJS.
 */
import van from "vanjs-core";

export { van };

// Componentes Básicos
export { Button, PrimaryButton, SecondaryButton, type ButtonVariant, type ButtonSize } from "./components/button.js";
export { Field, Input, Select, Textarea } from "./components/field.js";
export { Form } from "./components/form.js";
export { Modal, ModalBase, type ModalContent, type ModalZone, type ModalProps } from "./components/modal.js";
export { Spin } from "./components/spin.js";
export { SpinModal } from "./components/spin-modal.js";
export { Nav, type NavLink } from "./components/nav.js";
export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize } from "./components/badge.js";
export { Table, type TableProps, type TableColumn } from "./components/table.js";
export { toast, type ToastType, type ToastOptions, type ToastItem } from "./components/toast.js";

// Pantallas / Formularios preconstruidos
export { LoginForm } from "./pages/login.js";
export { RegisterForm } from "./pages/register.js";

// Autenticación de Cliente
export {
  createAuth,
  requireAuth,
  type AuthUser,
  type AuthApi,
  type AuthStatus,
  type AuthState,
} from "./auth.js";

// Enrutador SPA
export {
  Router,
  type RouteParams,
  type RouteContext,
  type Guard,
  type RouteOptions,
  type RouteFactory,
} from "./router.js";

// Helpers de red y reactividad
export {
  createQuery,
  createMutation,
  type QueryOptions,
  type QueryResult,
  type MutationOptions,
  type MutationResult,
} from "./fetch.js";

// Validadores
export {
  Required,
  Email,
  MinLength,
  Match,
  type Validator,
} from "./validators.js";

// Utilidades generales
export { cx } from "./util.js";

// Tema (Claro / Oscuro / Sistema)
export {
  createTheme,
  type ThemeMode,
  type ThemeOptions,
  type ThemeInstance,
} from "./theme.js";

// Internacionalización (i18n)
export {
  createI18n,
  type I18nOptions,
  type I18nInstance,
} from "./i18n.js";
