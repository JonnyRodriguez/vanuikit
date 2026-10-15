import van, { type State } from "vanjs-core";
import type { AuthState, AuthUser } from "../auth.js";
import { i18n as defaultI18n, type I18nInstance } from "../i18n.js";
import { cx } from "../util.js";

export interface UserBadgeProps {
  /** Estado de autenticación reactivo de VanUI o usuario directo */
  auth?: AuthState;
  user?: State<AuthUser | null> | AuthUser | null;
  i18n?: I18nInstance;
  /** Callback opcional al hacer clic en cerrar sesión */
  onLogout?: () => void | Promise<void>;
  /** Subtítulo o estado secundario (por defecto reactivo a "Sesión activa") */
  statusText?: string | State<string>;
  /** Mostrar u ocultar el botón de logout */
  showLogout?: boolean;
  /** Modo compacto para sidebars colapsadas: solo avatar + logout (title con el nombre) */
  compact?: boolean | State<boolean>;
  /** Clases CSS adicionales para el contenedor */
  class?: string;
}

/**
 * Componente nativo y autocontenido para mostrar la tarjeta/perfil del usuario autenticado.
 * Embebido directamente en VanUI para máxima focalización y cero boilerplate en las aplicaciones.
 */
export function UserBadge(props: UserBadgeProps) {
  const { div, span, button } = van.tags;
  const i18n = props.i18n ?? defaultI18n;
  const showLogout = props.showLogout ?? true;

  const getUser = (): AuthUser | null => {
    if (props.auth) {
      return props.auth.user.val;
    }
    if (props.user) {
      if (typeof props.user === "object" && "val" in props.user) {
        return (props.user as any).val;
      }
      return props.user as AuthUser;
    }
    return null;
  };

  const getInitials = (u: AuthUser): string => {
    const name = typeof u.name === "string" ? u.name : "";
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (u.email) {
      return u.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    if (props.auth) {
      await props.auth.logout();
    }
    if (props.onLogout) {
      await props.onLogout();
    }
  };

  return () => {
    const currentUser = getUser();
    if (!currentUser) {
      return div({ class: "hidden", "aria-hidden": "true" });
    }

    const initials = getInitials(currentUser);
    const displayName = (typeof currentUser.name === "string" && currentUser.name) ? currentUser.name : currentUser.email;
    const isCompact =
      typeof props.compact === "object" && props.compact !== null && "val" in props.compact
        ? props.compact.val
        : Boolean(props.compact);

    // Modo compacto (rail de Sidebar colapsada): avatar centrado + logout icónico.
    if (isCompact) {
      const logoutLabel = i18n.raw("nav.logout", "Cerrar sesión");
      return div(
        { class: cx("flex flex-col items-center gap-2", props.class) },
        div(
          {
            class:
              "w-9 h-9 rounded-full bg-primary text-primary-fg font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs select-none",
            title: displayName,
            "aria-label": displayName,
          },
          initials,
        ),
        showLogout
          ? button(
              {
                type: "button",
                class:
                  "w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30 transition cursor-pointer flex items-center justify-center text-sm select-none",
                "aria-label": logoutLabel,
                title: logoutLabel,
                onclick: handleLogout,
              },
              "🚪",
            )
          : null,
      );
    }

    return div(
      {
        class: cx(
          "flex flex-col gap-2.5 p-3 rounded-xl bg-secondary/40 border border-border/50 transition-all",
          props.class,
        ),
      },
      div(
        { class: "flex items-center gap-2.5 min-w-0" },
        div(
          {
            class:
              "w-8 h-8 rounded-full bg-primary text-primary-fg font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs select-none",
          },
          initials,
        ),
        div(
          { class: "flex flex-col min-w-0 flex-1" },
          span(
            { class: "text-xs font-semibold text-foreground truncate", title: displayName },
            displayName,
          ),
          span(
            { class: "text-[10px] text-muted-foreground truncate" },
            props.statusText
              ? props.statusText
              : i18n.raw("user.sessionActive", "Sesión activa"),
          ),
        ),
      ),
      showLogout
        ? button(
            {
              type: "button",
              class:
                "w-full text-xs font-medium py-1.5 px-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30 transition cursor-pointer text-center select-none",
              onclick: handleLogout,
            },
            "🚪 ",
            i18n.t("nav.logout", "Cerrar sesión"),
          )
        : null,
    );
  };
}
