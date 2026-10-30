import type { State } from "vanjs-core";
export interface I18nOptions<T extends Record<string, any> = Record<string, any>> {
    defaultLocale: string;
    locales?: Record<string, T>;
    storageKey?: string;
}
export interface I18nInstance<T extends Record<string, any> = Record<string, any>> {
    currentLocale: State<string>;
    locales: Record<string, Record<string, any>>;
    setLocale: (locale: string) => void;
    getLocale: () => string;
    /**
     * Permite que componentes individuales (como Field, Modal, etc.)
     * registren sus propios diccionarios de traducciones co-ubicados.
     */
    addTranslations: (translations: Record<string, Record<string, any>>) => void;
    /**
     * Retorna una derivación reactiva (State<string>) con el texto traducido.
     * Al insertarlo en el DOM de VanJS, se actualiza automáticamente cuando cambia el idioma.
     */
    t: (key: string, defaultVal?: string, params?: Record<string, string | number>) => State<string>;
    /**
     * Retorna el texto traducido como string estático (no reactivo).
     */
    raw: (key: string, defaultVal?: string, params?: Record<string, string | number>) => string;
}
/** Diccionario global por defecto para VanUikit */
export declare const defaultLocales: Record<string, Record<string, any>>;
/**
 * Gestor reactivo y ultraligero de internacionalización (i18n) para VanJS.
 */
export declare function createI18n<T extends Record<string, any> = Record<string, any>>(options?: I18nOptions<T>): I18nInstance<T>;
/** Singleton global de i18n */
export declare const i18n: I18nInstance<Record<string, any>>;
/** Helper reactivo directo con el singleton */
export declare const t: (key: string, defaultVal?: string, params?: Record<string, string | number>) => State<string>;
/** Helper raw directo con el singleton */
export declare const raw: (key: string, defaultVal?: string, params?: Record<string, string | number>) => string;
//# sourceMappingURL=i18n.d.ts.map