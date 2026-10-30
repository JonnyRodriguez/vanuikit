import { type State } from "vanjs-core";
export type ThemeMode = "light" | "dark" | "system";
export interface ThemeOptions {
    storageKey?: string;
    defaultMode?: ThemeMode;
    attribute?: string;
}
export interface ThemeInstance {
    mode: State<ThemeMode>;
    isDark: State<boolean>;
    setMode: (mode: ThemeMode) => void;
    toggle: () => void;
}
/**
 * Gestor reactivo de tema (Claro / Oscuro / Sistema) para VanJS.
 * Sincroniza la clase `.dark` en el elemento <html> y persiste la preferencia.
 */
export declare function createTheme(options?: ThemeOptions): ThemeInstance;
//# sourceMappingURL=theme.d.ts.map