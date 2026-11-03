// vanuikit/src/index.ts
/**
 * VanUikit — Library of modular, reactive components for VanJS.
 */
import van from "vanjs-core";
import {
  guardSingleVan,
  captureOwnStateProto,
  isOwnState,
  isForeignState,
  warnForeignState,
} from "./van-singleton.js";

// Single-instance rule: if this bundle ships two copies of vanjs-core,
// warn in console with the solution (see van-singleton.ts).
guardSingleVan(van);

// Capture the prototype of OUR copy's states so the library can detect a
// State coming from another copy (the silent two-copies failure).
captureOwnStateProto(van);

export { van };
export { isOwnState, isForeignState, warnForeignState };

// Basic Components
export { Button, PrimaryButton, SecondaryButton, type ButtonVariant, type ButtonSize } from "./components/button.js";
export { Field, TextField, EmailField, PasswordField, TextareaField, type TextareaFieldOptions } from "./components/field.js";
export { Checkbox, type CheckboxOptions, type CheckboxField, type CheckSize, type ToggleText } from "./components/checkbox.js";
export { Switch, type SwitchOptions, type SwitchField } from "./components/switch.js";
export { RadioGroup, type RadioGroupOptions, type RadioGroupField, type RadioOption } from "./components/radio.js";
export { Form, type FormResult, type FormOptions, type FormConfig, type FormLegacyHandler, type SchemaLike } from "./components/form.js";
export { Wizard, type WizardOptions, type WizardStep, type WizardHandle } from "./components/wizard.js";
export { Modal, ModalBase, type ModalContent, type ModalZone, type ModalProps } from "./components/modal.js";
export { Spin } from "./components/spin.js";
export { SpinModal } from "./components/spin-modal.js";
export { Nav, Link, type NavLink, type LinkProps, type LinkVariant } from "./components/nav.js";
export { Svg, SvgPath, type SvgProps, type SvgPathProps } from "./components/svg.js";
export { Icon, type IconName, type IconProps } from "./components/icon.js";
export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize } from "./components/badge.js";
export { Table, DataGrid, type TableProps, type TableColumn } from "./components/table.js";
export { Tabs, type TabItem, type TabsProps } from "./components/tabs.js";
export {
  AppShell,
  Sidebar,
  SidebarItem,
  SidebarGroup,
  HeaderBar,
  type AppShellProps,
  type SidebarProps,
  type SidebarItemProps,
  type SidebarGroupProps,
  type HeaderBarProps,
} from "./components/layout.js";
export {
  SelectDropdown,
  DropdownMenu,
  type SelectOption,
  type SelectDropdownProps,
  type DropdownMenuItem,
  type DropdownMenuProps,
} from "./components/dropdown.js";
export {
  ConfirmDialog,
  confirmDialog,
  type ConfirmDialogProps,
  type ConfirmVariant,
} from "./components/confirm-dialog.js";
export { toast, type ToastType, type ToastOptions, type ToastItem } from "./components/toast.js";
export { Alert, type AlertOptions, type AlertVariant } from "./components/alert.js";
export { Progress, type ProgressOptions, type ProgressSize } from "./components/progress.js";
export { Skeleton, type SkeletonOptions, type SkeletonVariant } from "./components/skeleton.js";
export { EmptyState, type EmptyStateOptions } from "./components/empty-state.js";
export { Tooltip, type TooltipOptions, type TooltipPosition } from "./components/tooltip.js";
export { Popover, type PopoverOptions, type PopoverPosition } from "./components/popover.js";
export { Drawer, type DrawerOptions, type DrawerSide } from "./components/drawer.js";
export { Avatar, getInitials, type AvatarOptions, type AvatarSize } from "./components/avatar.js";
export { Breadcrumbs, type BreadcrumbsOptions, type BreadcrumbItem } from "./components/breadcrumbs.js";
export { Card, CardTitle, type CardOptions, type CardTitleOptions } from "./components/card.js";
export { Accordion, type AccordionOptions, type AccordionItem } from "./components/accordion.js";
export { Combobox, type ComboboxOptions, type ComboboxOption, type ComboboxField } from "./components/combobox.js";
export { Pagination, pageSlots, type PaginationOptions } from "./components/pagination.js";
export { DatePicker, type DatePickerOptions, type DatePickerField } from "./components/datepicker.js";
export { Kbd, type KbdOptions } from "./components/kbd.js";
export { trace, expectReactive, type ExpectReactiveOptions } from "./debug.js";
export { installVanDebug, type VanDebugApi, type VanDebugGraph, type VanDebugDiagnostic, type ViolationKind } from "./debug-graph.js";
export {
  ThemeToggle,
  type ThemeToggleProps,
} from "./components/theme-toggle.js";
export {
  LocaleSelector,
  type LocaleSelectorProps,
  type LocaleOption,
} from "./components/locale-selector.js";
export {
  UserBadge,
  type UserBadgeProps,
} from "./components/user-badge.js";

// Prebuilt screens / forms
export { LoginForm } from "./pages/login.js";
export { RegisterForm } from "./pages/register.js";

// Client-side Authentication
export {
  createAuth,
  requireAuth,
  type AuthUser,
  type AuthApi,
  type AuthStatus,
  type AuthState,
} from "./auth.js";

// SPA Router
export {
  Router,
  createRouter,
  navigate,
  getActiveRouter,
  setActiveRouter,
  type RouteParams,
  type RouteContext,
  type Guard,
  type RouteOptions,
  type RouteFactory,
} from "./router.js";

// Network and reactivity helpers
export {
  createQuery,
  createMutation,
  type QueryOptions,
  type QueryResult,
  type MutationOptions,
  type MutationResult,
} from "./fetch.js";

// Validators
export {
  Required,
  Email,
  MinLength,
  Match,
  type Validator,
} from "./validators.js";

// General utilities
export { cx } from "./util.js";

// Theme (Light / Dark / System)
export {
  createTheme,
  type ThemeMode,
  type ThemeOptions,
  type ThemeInstance,
} from "./theme.js";

// Internationalization (i18n)
export {
  createI18n,
  i18n,
  t,
  raw,
  type I18nOptions,
  type I18nInstance,
} from "./i18n.js";

// Locale-aware formatting (dates, numbers, currency — the other half of i18n)
export {
  createFmt,
  fmt,
  type DateInput,
  type FmtCurrencyOptions,
  type Fmt,
  type RelativeUnit,
} from "./fmt.js";
