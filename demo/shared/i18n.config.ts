import { createI18n } from "vanui";

export const locales = {
  es: {
    nav: {
      gateways: "Pasarelas",
      components: "Componentes",
      login: "Acceder",
      logout: "Salir",
    },
    theme: {
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
    },
    lang: {
      es: "Español",
      en: "English",
    },
    gateways: {
      title: "Métodos de Pago y Recarga",
      subtitle: "Selecciona una pasarela para realizar tu recarga de saldo.",
      badge: "Activo",
      select: "Seleccionar",
    },
    components: {
      title: "Catálogo de Componentes",
      subtitle: "Componentes interactivos construidos con VanJS y VanUI",
      buttons: "Botones",
      badges: "Etiquetas (Badges)",
      tables: "Tablas",
      toasts: "Notificaciones (Toast)",
      modals: "Modales",
      spinners: "Indicadores de Carga",
      themeSection: "Gestión de Tema e Idioma",
    },
  },
  en: {
    nav: {
      gateways: "Gateways",
      components: "Components",
      login: "Sign In",
      logout: "Sign Out",
    },
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    lang: {
      es: "Español",
      en: "English",
    },
    gateways: {
      title: "Payment & Top-up Methods",
      subtitle: "Select a payment gateway to top up your balance.",
      badge: "Active",
      select: "Select",
    },
    components: {
      title: "Component Showcase",
      subtitle: "Interactive components built with VanJS and VanUI",
      buttons: "Buttons",
      badges: "Badges",
      tables: "Tables",
      toasts: "Notifications (Toast)",
      modals: "Modals",
      spinners: "Loading Spinners",
      themeSection: "Theme & Locale Management",
    },
  },
};

export const i18n = createI18n({
  defaultLocale: "es",
  locales,
});
