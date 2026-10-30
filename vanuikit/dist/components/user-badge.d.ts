import { type State } from "vanjs-core";
import type { AuthState, AuthUser } from "../auth.js";
import { type I18nInstance } from "../i18n.js";
export interface UserBadgeProps {
    /** Estado de autenticación reactivo de VanUikit o usuario directo */
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
 * Embebido directamente en VanUikit para máxima focalización y cero boilerplate en las aplicaciones.
 */
export declare function UserBadge(props: UserBadgeProps): () => HTMLDivElement;
//# sourceMappingURL=user-badge.d.ts.map