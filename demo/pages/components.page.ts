// demo/pages/components.page.ts
import {
  van,
  Button,
  Badge,
  DataGrid,
  Tabs,
  SelectDropdown,
  DropdownMenu,
  confirmDialog,
  toast,
  ModalBase,
  Spin,
  ThemeToggle,
  LocaleSelector,
  type TableColumn,
  type Router,
} from "vanui";
import { i18n } from "../shared/i18n.config.js";
import { theme } from "../shared/theme.config.js";

const { div, h1, h2, h3, p, span, section } = van.tags;

interface SampleUser {
  id: string;
  name: string;
  role: string;
  status: "active" | "pending" | "suspended";
  created: string;
}

export type ComponentsPageProps = {
  router?: Router;
};

/**
 * Contrato de llaves de i18n de la página (cero strings quemados).
 * Las llaves son planas ("components.*") para espejar los diccionarios de
 * `shared/i18n.config.ts`; el agrupado aquí es solo para legibilidad.
 */
export const TEXTS = {
  title: { key: "components.title", default: "Catálogo de Componentes" },
  subtitle: { key: "components.subtitle", default: "Componentes interactivos construidos con VanJS y VanUI" },

  theme: {
    section: { key: "components.themeSection", default: "Gestión de Tema e Idioma" },
    desc: { key: "components.themeDesc", default: "Gestión de estado global sin overhead: alternancia instantánea y sincronización automática." },
    embeddedBadge: { key: "components.embeddedBadge", default: "Embebidos en VanUI" },
    themeToggleDemo: { key: "components.themeToggleDemo", default: "ThemeToggle (Botón y Segmentado)" },
    localeSelectorDemo: { key: "components.localeSelectorDemo", default: "LocaleSelector (Select y Botones)" },
  },

  tabs: {
    section: { key: "components.tabs", default: "Pestañas (Tabs)" },
    desc: { key: "components.tabsDesc", default: "Organiza contenido denso con soporte para flechas de teclado (←/→, Home, End), badges y múltiples variantes." },
    accessibleBadge: { key: "components.accessibleBadge", default: "Accesible ARIA" },
    overview: { key: "components.tabOverview", default: "Resumen General" },
    overviewBadge: { key: "components.tabOverviewBadge", default: "Nuevo" },
    perfTitle: { key: "components.perfTitle", default: "📊 Panel de Rendimiento" },
    perfBody: { key: "components.perfBody", default: "VanUI permite renderizar vistas SPA reactivas con un bundle ultra liviano (~1.5kB de VanJS core) sin VDOM." },
    activity: { key: "components.tabActivity", default: "Actividad" },
    eventsTitle: { key: "components.eventsTitle", default: "⚡ Registro de Eventos" },
    eventsBody: { key: "components.eventsBody", default: "Se registraron 4 operaciones exitosas en las últimas 24 horas." },
    security: { key: "components.tabSecurity", default: "Seguridad" },
    securityTitle: { key: "components.securityTitle", default: "🔒 Autenticación y Cifrado" },
    securityBody: { key: "components.securityBody", default: "Sesiones protegidas con guards síncronos y asíncronos en el enrutador SPA." },
    disabled: { key: "components.tabDisabled", default: "Deshabilitado" },
    disabledContent: { key: "components.disabledContent", default: "No accesible" },
  },

  dropdowns: {
    section: { key: "components.dropdowns", default: "Select y Dropdowns Accesibles" },
    desc: { key: "components.dropdownsDesc", default: "Selectores personalizados con navegación completa por teclado, búsqueda integrada y menús de acciones contextuales." },
    listboxBadge: { key: "components.listboxBadge", default: "Listbox + Menú" },
    searchSelect: { key: "components.searchSelect", default: "Select con Búsqueda" },
    searchPlaceholder: { key: "components.selectSearchPlaceholder", default: "Buscar framework..." },
    currentValue: { key: "components.currentValue", default: "Valor actual: {val}" },
    selectedToast: { key: "components.selectedToast", default: "Seleccionado: {val}" },
    countrySelect: { key: "components.countrySelect", default: "Selector con Iconos" },
    frameworkVanjs: { key: "components.frameworkVanjs", default: "Ultra lightweight (1.0kB)" },
    frameworkReact: { key: "components.frameworkReact", default: "Popular ecosystem" },
    frameworkVue: { key: "components.frameworkVue", default: "Progressive framework" },
    frameworkSvelte: { key: "components.frameworkSvelte", default: "Cybernetically enhanced" },
    countryEs: { key: "components.countryEs", default: "España" },
    countryUs: { key: "components.countryUs", default: "Estados Unidos" },
    countryFr: { key: "components.countryFr", default: "Francia" },
    countryMx: { key: "components.countryMx", default: "México" },
    countryAr: { key: "components.countryAr", default: "Argentina" },
    countryToast: { key: "components.countryToast", default: "País seleccionado: {val}" },
    actionsMenu: { key: "components.actionsMenu", default: "Menú de Acciones" },
    actionsLabel: { key: "components.actionsLabel", default: "Acciones" },
    accountHeader: { key: "components.accountHeader", default: "Opciones de cuenta" },
    viewProfile: { key: "components.viewProfile", default: "Ver Perfil" },
    profileToast: { key: "components.profileToast", default: "Navegando al perfil" },
    settings: { key: "components.settings", default: "Configuración" },
    settingsToast: { key: "components.settingsToast", default: "Abriendo configuración" },
    proBadge: { key: "components.proBadge", default: "Pro" },
    signOut: { key: "components.signOut", default: "Cerrar Sesión" },
    signOutToast: { key: "components.signOutToast", default: "Sesión cerrada" },
  },

  confirm: {
    section: { key: "components.confirmDialogs", default: "Diálogos de Confirmación (ConfirmDialog)" },
    desc: { key: "components.confirmDesc", default: "Abstracción sobre Modal para confirmaciones críticas con soporte para Promises, estados de carga y variantes." },
    imperativeBadge: { key: "components.imperativeBadge", default: "Imperativo & Declarativo" },
    dangerBtn: { key: "components.dangerBtn", default: "🗑️ Diálogo Peligroso (Imperativo)" },
    deleteTitle: { key: "components.deleteTitle", default: "¿Eliminar cuenta permanentemente?" },
    deleteMsg: { key: "components.deleteMsg", default: "Esta acción borrará todos tus datos y transacciones asociadas sin posibilidad de recuperación." },
    deleteConfirm: { key: "components.deleteConfirm", default: "Sí, eliminar cuenta" },
    cancel: { key: "components.cancel", default: "Cancelar" },
    deletedToast: { key: "components.deletedToast", default: "Cuenta eliminada satisfactoriamente" },
    cancelledToast: { key: "components.cancelledToast", default: "Acción cancelada por el usuario" },
    infoBtn: { key: "components.infoBtn", default: "🚀 Diálogo Informativo" },
    publishTitle: { key: "components.publishTitle", default: "¿Publicar cambios?" },
    publishMsg: { key: "components.publishMsg", default: "Los cambios se aplicarán inmediatamente a todos los usuarios en producción." },
    publishConfirm: { key: "components.publishConfirm", default: "Publicar ahora" },
    publishedToast: { key: "components.publishedToast", default: "Cambios publicados en producción" },
  },

  table: {
    section: { key: "components.tables", default: "Tablas y DataGrid" },
    desc: { key: "components.tablesDesc", default: "Tabla de datos reactiva con ordenamiento bidireccional por columna, búsqueda instantánea, selección múltiple y paginación." },
    searchSortBadge: { key: "components.searchSortBadge", default: "Búsqueda + Sort + Paginación" },
    colUser: { key: "components.colUser", default: "Usuario" },
    colRole: { key: "components.colRole", default: "Rol" },
    colStatus: { key: "components.colStatus", default: "Estado" },
    colCreated: { key: "components.colCreated", default: "Fecha Alta" },
    statusActive: { key: "components.statusActive", default: "Activo" },
    statusPending: { key: "components.statusPending", default: "Pendiente" },
    statusSuspended: { key: "components.statusSuspended", default: "Suspendido" },
    searchPlaceholder: { key: "components.tableSearchPlaceholder", default: "Buscar por nombre o rol..." },
    usersSelected: { key: "components.usersSelected", default: "{n} usuarios seleccionados" },
  },

  badges: {
    section: { key: "components.badges", default: "Etiquetas (Badges)" },
    primary: { key: "components.badgePrimary", default: "Primario" },
    success: { key: "components.badgeSuccess", default: "Éxito" },
    warning: { key: "components.badgeWarning", default: "Advertencia" },
    danger: { key: "components.badgeDanger", default: "Peligro" },
    secondary: { key: "components.badgeSecondary", default: "Secundario" },
    outline: { key: "components.badgeOutline", default: "Contorno" },
    large: { key: "components.badgeLarge", default: "Grande" },
  },

  toasts: {
    section: { key: "components.toasts", default: "Notificaciones (Toast)" },
    successBtn: { key: "components.toastSuccessBtn", default: "Éxito" },
    successMsg: { key: "components.toastSuccessMsg", default: "Operación realizada con éxito" },
    successTitle: { key: "components.toastSuccessTitle", default: "Completado" },
    infoBtn: { key: "components.toastInfoBtn", default: "Información" },
    infoMsg: { key: "components.toastInfoMsg", default: "Hay una nueva actualización disponible" },
    infoTitle: { key: "components.toastInfoTitle", default: "Novedad" },
    warningBtn: { key: "components.toastWarningBtn", default: "Advertencia" },
    warningMsg: { key: "components.toastWarningMsg", default: "La sesión expirará en 5 minutos" },
    warningTitle: { key: "components.toastWarningTitle", default: "Aviso" },
    errorBtn: { key: "components.toastErrorBtn", default: "Error" },
    errorMsg: { key: "components.toastErrorMsg", default: "No se pudo conectar con el servidor" },
    errorTitle: { key: "components.toastErrorTitle", default: "Fallo" },
  },

  modal: {
    section: { key: "components.modals", default: "Modales" },
    openBtn: { key: "components.openModalBtn", default: "Abrir Modal Básico" },
    title: { key: "components.modalTitle", default: "Modal Básico VanUI" },
    body: { key: "components.modalBody", default: "Este modal es completamente reactivo y se monta/desmonta con estados nativos de VanJS." },
    close: { key: "components.modalClose", default: "Cerrar" },
    accept: { key: "components.modalAccept", default: "Aceptar" },
    confirmedToast: { key: "components.modalConfirmedToast", default: "Acción confirmada desde el modal" },
    spinMsg: { key: "components.spinMsg", default: "Indicador de carga..." },
  },

  layouts: {
    section: { key: "components.layoutsSection", default: "Layouts & Dashboard Shell" },
    desc: { key: "components.layoutsDesc", default: "Estructura adaptable Mobile-First con Drawer deslizable en pantallas táctiles y Sidebar estática en escritorio." },
    mobileDrawerTitle: { key: "components.mobileDrawerTitle", default: "Mobile-First Drawer" },
    mobileDrawerDesc: { key: "components.mobileDrawerDesc", default: "Backdrop oscurecido con desenfoque, cierre automático al seleccionar enlace y botón hamburguesa accesible." },
    desktopSidebarTitle: { key: "components.desktopSidebarTitle", default: "Desktop Sidebar" },
    desktopSidebarDesc: { key: "components.desktopSidebarDesc", default: "Panel lateral persistente con soporte para grupos de navegación, íconos, badges reactivos y pie de página de usuario." },
    headerSyncTitle: { key: "components.headerSyncTitle", default: "HeaderBar & Router Sync" },
    headerSyncDesc: { key: "components.headerSyncDesc", default: "Sincronización automática de títulos y enlaces activos (aria-current) con el router singleton de la app." },
  },
} as const;

export function ComponentsPage(_props: ComponentsPageProps = {}) {
  const modal = ModalBase();

  // State para SelectDropdown
  const selectedFramework = van.state("vanjs");
  const selectedCountry = van.state("es");

  // State para DataGrid
  const sampleUsers = van.state<SampleUser[]>([
    { id: "usr_1", name: "Ana Morales", role: "Administrador", status: "active", created: "2026-01-10" },
    { id: "usr_2", name: "Carlos Ramos", role: "Desarrollador", status: "active", created: "2026-02-14" },
    { id: "usr_3", name: "Lucía Fernández", role: "Diseñadora", status: "pending", created: "2026-03-01" },
    { id: "usr_4", name: "David Ruiz", role: "Auditor", status: "suspended", created: "2026-03-12" },
    { id: "usr_5", name: "Elena Gómez", role: "Soporte", status: "active", created: "2026-04-05" },
    { id: "usr_6", name: "Marcos Varela", role: "DevOps", status: "active", created: "2026-05-20" },
  ]);

  const selectedUsers = van.state<SampleUser[]>([]);

  const columns: TableColumn<SampleUser>[] = [
    { key: "name", header: i18n.t(TEXTS.table.colUser.key, undefined, TEXTS.table.colUser.default), sortable: true },
    { key: "role", header: i18n.t(TEXTS.table.colRole.key, undefined, TEXTS.table.colRole.default), sortable: true },
    {
      key: "status",
      header: i18n.t(TEXTS.table.colStatus.key, undefined, TEXTS.table.colStatus.default),
      sortable: true,
      render: (row) => {
        const variantMap: Record<SampleUser["status"], "success" | "warning" | "danger"> = {
          active: "success",
          pending: "warning",
          suspended: "danger",
        };
        const textMap = {
          active: i18n.t(TEXTS.table.statusActive.key, undefined, TEXTS.table.statusActive.default),
          pending: i18n.t(TEXTS.table.statusPending.key, undefined, TEXTS.table.statusPending.default),
          suspended: i18n.t(TEXTS.table.statusSuspended.key, undefined, TEXTS.table.statusSuspended.default),
        };
        return Badge({
          variant: variantMap[row.status],
          text: textMap[row.status],
          dot: true,
          size: "sm",
        });
      },
    },
    { key: "created", header: i18n.t(TEXTS.table.colCreated.key, undefined, TEXTS.table.colCreated.default), sortable: true, align: "right" },
  ];

  return div(
    {
      id: "components-page",
      class: "space-y-12 py-4",
    },
    // Cabecera Principal
    div(
      { class: "border-b border-border pb-5" },
      h1({ class: "text-3xl font-extrabold text-foreground" }, i18n.t(TEXTS.title.key, undefined, TEXTS.title.default)),
      p({ class: "text-foreground-soft text-sm mt-1" }, i18n.t(TEXTS.subtitle.key, undefined, TEXTS.subtitle.default)),
    ),

    // 1. Theme & i18n Control Section (Componentes Embebidos de VanUI)
    section(
      { class: "space-y-5 p-6 rounded-2xl border border-border bg-secondary/10 shadow-sm" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-lg font-bold text-foreground" }, i18n.t(TEXTS.theme.section.key, undefined, TEXTS.theme.section.default)),
        Badge({ text: i18n.t(TEXTS.theme.embeddedBadge.key, undefined, TEXTS.theme.embeddedBadge.default), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t(TEXTS.theme.desc.key, undefined, TEXTS.theme.desc.default)),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-2" },
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t(TEXTS.theme.themeToggleDemo.key, undefined, TEXTS.theme.themeToggleDemo.default)),
          div(
            { class: "flex flex-wrap items-center gap-3" },
            ThemeToggle({ theme, i18n, showLabel: true }),
            ThemeToggle({ theme, i18n, variant: "segmented" }),
          ),
        ),
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t(TEXTS.theme.localeSelectorDemo.key, undefined, TEXTS.theme.localeSelectorDemo.default)),
          div(
            { class: "flex flex-wrap items-center gap-3" },
            LocaleSelector({ i18n }),
            LocaleSelector({ i18n, variant: "buttons" }),
          ),
        ),
      ),
    ),

    // 2. Tabs (Pestañas accesibles y reactivas)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t(TEXTS.tabs.section.key, undefined, TEXTS.tabs.section.default)),
        Badge({ text: i18n.t(TEXTS.tabs.accessibleBadge.key, undefined, TEXTS.tabs.accessibleBadge.default), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t(TEXTS.tabs.desc.key, undefined, TEXTS.tabs.desc.default)),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm space-y-6" },
        // Variante Underline
        Tabs({
          id: "demo-tabs-underline",
          variant: "underline",
          items: [
            {
              id: "overview",
              label: i18n.t(TEXTS.tabs.overview.key, undefined, TEXTS.tabs.overview.default),
              badge: i18n.t(TEXTS.tabs.overviewBadge.key, undefined, TEXTS.tabs.overviewBadge.default),
              content: div(
                { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                h3({ class: "font-bold text-foreground text-base" }, i18n.t(TEXTS.tabs.perfTitle.key, undefined, TEXTS.tabs.perfTitle.default)),
                p({ class: "text-foreground-soft leading-relaxed" }, i18n.t(TEXTS.tabs.perfBody.key, undefined, TEXTS.tabs.perfBody.default)),
              ),
            },
            {
              id: "activity",
              label: i18n.t(TEXTS.tabs.activity.key, undefined, TEXTS.tabs.activity.default),
              badge: 4,
              content: div(
                { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                h3({ class: "font-bold text-foreground text-base" }, i18n.t(TEXTS.tabs.eventsTitle.key, undefined, TEXTS.tabs.eventsTitle.default)),
                p({ class: "text-foreground-soft" }, i18n.t(TEXTS.tabs.eventsBody.key, undefined, TEXTS.tabs.eventsBody.default)),
              ),
            },
            {
              id: "security",
              label: i18n.t(TEXTS.tabs.security.key, undefined, TEXTS.tabs.security.default),
              content: div(
                { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                h3({ class: "font-bold text-foreground text-base" }, i18n.t(TEXTS.tabs.securityTitle.key, undefined, TEXTS.tabs.securityTitle.default)),
                p({ class: "text-foreground-soft" }, i18n.t(TEXTS.tabs.securityBody.key, undefined, TEXTS.tabs.securityBody.default)),
              ),
            },
            {
              id: "disabled-tab",
              label: i18n.t(TEXTS.tabs.disabled.key, undefined, TEXTS.tabs.disabled.default),
              disabled: true,
              content: div(i18n.t(TEXTS.tabs.disabledContent.key, undefined, TEXTS.tabs.disabledContent.default)),
            },
          ],
        }),
      ),
    ),

    // 3. Select / Dropdowns Accesibles
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t(TEXTS.dropdowns.section.key, undefined, TEXTS.dropdowns.section.default)),
        Badge({ text: i18n.t(TEXTS.dropdowns.listboxBadge.key, undefined, TEXTS.dropdowns.listboxBadge.default), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t(TEXTS.dropdowns.desc.key, undefined, TEXTS.dropdowns.desc.default)),
      div(
        { class: "grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        // Select con búsqueda
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t(TEXTS.dropdowns.searchSelect.key, undefined, TEXTS.dropdowns.searchSelect.default)),
          SelectDropdown({
            id: "framework-select",
            searchable: true,
            searchPlaceholder: i18n.t(TEXTS.dropdowns.searchPlaceholder.key, undefined, TEXTS.dropdowns.searchPlaceholder.default),
            value: selectedFramework,
            options: [
              { value: "vanjs", label: "VanJS", description: i18n.t(TEXTS.dropdowns.frameworkVanjs.key, undefined, TEXTS.dropdowns.frameworkVanjs.default) },
              { value: "react", label: "React", description: i18n.t(TEXTS.dropdowns.frameworkReact.key, undefined, TEXTS.dropdowns.frameworkReact.default) },
              { value: "vue", label: "Vue", description: i18n.t(TEXTS.dropdowns.frameworkVue.key, undefined, TEXTS.dropdowns.frameworkVue.default) },
              { value: "svelte", label: "Svelte", description: i18n.t(TEXTS.dropdowns.frameworkSvelte.key, undefined, TEXTS.dropdowns.frameworkSvelte.default) },
            ],
            onChange: (val) => toast.info(i18n.raw(TEXTS.dropdowns.selectedToast.key, { val }, TEXTS.dropdowns.selectedToast.default)),
          }),
          p(
            { class: "text-xs text-muted" },
            // raw() lee currentLocale.val dentro del binding: reacciona al idioma y al valor.
            () => i18n.raw(TEXTS.dropdowns.currentValue.key, { val: selectedFramework.val }, TEXTS.dropdowns.currentValue.default),
          ),
        ),

        // Select de Países
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t(TEXTS.dropdowns.countrySelect.key, undefined, TEXTS.dropdowns.countrySelect.default)),
          SelectDropdown({
            id: "country-select",
            value: selectedCountry,
            options: [
              { value: "es", label: i18n.t(TEXTS.dropdowns.countryEs.key, undefined, TEXTS.dropdowns.countryEs.default), icon: span("🇪🇸") },
              { value: "us", label: i18n.t(TEXTS.dropdowns.countryUs.key, undefined, TEXTS.dropdowns.countryUs.default), icon: span("🇺🇸") },
              { value: "fr", label: i18n.t(TEXTS.dropdowns.countryFr.key, undefined, TEXTS.dropdowns.countryFr.default), icon: span("🇫🇷") },
              { value: "mx", label: i18n.t(TEXTS.dropdowns.countryMx.key, undefined, TEXTS.dropdowns.countryMx.default), icon: span("🇲🇽") },
              { value: "ar", label: i18n.t(TEXTS.dropdowns.countryAr.key, undefined, TEXTS.dropdowns.countryAr.default), icon: span("🇦🇷") },
            ],
            onChange: (val) => toast.info(i18n.raw(TEXTS.dropdowns.countryToast.key, { val }, TEXTS.dropdowns.countryToast.default)),
          }),
        ),

        // DropdownMenu contextual
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t(TEXTS.dropdowns.actionsMenu.key, undefined, TEXTS.dropdowns.actionsMenu.default)),
          div(
            { class: "pt-1" },
            DropdownMenu({
              trigger: (isOpen) =>
                Button(
                  { variant: "secondary" },
                  div({ class: "flex items-center gap-2" }, span(i18n.t(TEXTS.dropdowns.actionsLabel.key, undefined, TEXTS.dropdowns.actionsLabel.default)), span({ class: () => isOpen.val ? "rotate-180 transition-transform" : "transition-transform" }, "▾")),
                ),
              items: [
                { type: "header", label: i18n.raw(TEXTS.dropdowns.accountHeader.key, undefined, TEXTS.dropdowns.accountHeader.default) },
                { label: i18n.t(TEXTS.dropdowns.viewProfile.key, undefined, TEXTS.dropdowns.viewProfile.default), icon: span("👤"), onClick: () => toast.info(i18n.raw(TEXTS.dropdowns.profileToast.key, undefined, TEXTS.dropdowns.profileToast.default)) },
                { label: i18n.t(TEXTS.dropdowns.settings.key, undefined, TEXTS.dropdowns.settings.default), icon: span("⚙️"), badge: "Pro", onClick: () => toast.info(i18n.raw(TEXTS.dropdowns.settingsToast.key, undefined, TEXTS.dropdowns.settingsToast.default)) },
                { type: "divider" },
                { label: i18n.t(TEXTS.dropdowns.signOut.key, undefined, TEXTS.dropdowns.signOut.default), icon: span("🚪"), destructive: true, onClick: () => toast.warning(i18n.raw(TEXTS.dropdowns.signOutToast.key, undefined, TEXTS.dropdowns.signOutToast.default)) },
              ],
            }),
          ),
        ),
      ),
    ),

    // 4. ConfirmDialog (Diálogos de confirmación)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t(TEXTS.confirm.section.key, undefined, TEXTS.confirm.section.default)),
        Badge({ text: i18n.t(TEXTS.confirm.imperativeBadge.key, undefined, TEXTS.confirm.imperativeBadge.default), variant: "warning", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t(TEXTS.confirm.desc.key, undefined, TEXTS.confirm.desc.default)),
      div(
        { class: "flex flex-wrap items-center gap-4 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "destructive",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: i18n.raw(TEXTS.confirm.deleteTitle.key, undefined, TEXTS.confirm.deleteTitle.default),
                message: i18n.raw(TEXTS.confirm.deleteMsg.key, undefined, TEXTS.confirm.deleteMsg.default),
                variant: "danger",
                confirmText: i18n.raw(TEXTS.confirm.deleteConfirm.key, undefined, TEXTS.confirm.deleteConfirm.default),
                cancelText: i18n.raw(TEXTS.confirm.cancel.key, undefined, TEXTS.confirm.cancel.default),
              });

              if (confirmed) {
                toast.error(i18n.raw(TEXTS.confirm.deletedToast.key, undefined, TEXTS.confirm.deletedToast.default));
              } else {
                toast.info(i18n.raw(TEXTS.confirm.cancelledToast.key, undefined, TEXTS.confirm.cancelledToast.default));
              }
            },
          },
          i18n.t(TEXTS.confirm.dangerBtn.key, undefined, TEXTS.confirm.dangerBtn.default),
        ),
        Button(
          {
            variant: "secondary",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: i18n.raw(TEXTS.confirm.publishTitle.key, undefined, TEXTS.confirm.publishTitle.default),
                message: i18n.raw(TEXTS.confirm.publishMsg.key, undefined, TEXTS.confirm.publishMsg.default),
                variant: "primary",
                confirmText: i18n.raw(TEXTS.confirm.publishConfirm.key, undefined, TEXTS.confirm.publishConfirm.default),
              });

              if (confirmed) {
                toast.success(i18n.raw(TEXTS.confirm.publishedToast.key, undefined, TEXTS.confirm.publishedToast.default));
              }
            },
          },
          i18n.t(TEXTS.confirm.infoBtn.key, undefined, TEXTS.confirm.infoBtn.default),
        ),
      ),
    ),

    // 5. DataGrid / Table con búsqueda, ordenamiento y selección
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t(TEXTS.table.section.key, undefined, TEXTS.table.section.default)),
        Badge({ text: i18n.t(TEXTS.table.searchSortBadge.key, undefined, TEXTS.table.searchSortBadge.default), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t(TEXTS.table.desc.key, undefined, TEXTS.table.desc.default)),
      DataGrid({
        columns,
        data: sampleUsers,
        pageSize: 4,
        searchable: true,
        searchPlaceholder: i18n.t(TEXTS.table.searchPlaceholder.key, undefined, TEXTS.table.searchPlaceholder.default),
        selectable: true,
        selectedRows: selectedUsers,
        onSelectionChange: (selected) => {
          if (selected.length > 0) {
            toast.info(i18n.raw(TEXTS.table.usersSelected.key, { n: selected.length }, TEXTS.table.usersSelected.default), { durationMs: 1500 });
          }
        },
      }),
    ),

    // 6. Badges & Toasts
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t(TEXTS.badges.section.key, undefined, TEXTS.badges.section.default)),
      div(
        { class: "flex flex-wrap items-center gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Badge({ text: i18n.t(TEXTS.badges.primary.key, undefined, TEXTS.badges.primary.default), variant: "primary" }),
        Badge({ text: i18n.t(TEXTS.badges.success.key, undefined, TEXTS.badges.success.default), variant: "success", dot: true }),
        Badge({ text: i18n.t(TEXTS.badges.warning.key, undefined, TEXTS.badges.warning.default), variant: "warning", dot: true }),
        Badge({ text: i18n.t(TEXTS.badges.danger.key, undefined, TEXTS.badges.danger.default), variant: "danger", dot: true }),
        Badge({ text: i18n.t(TEXTS.badges.secondary.key, undefined, TEXTS.badges.secondary.default), variant: "secondary" }),
        Badge({ text: i18n.t(TEXTS.badges.outline.key, undefined, TEXTS.badges.outline.default), variant: "outline" }),
        Badge({ text: i18n.t(TEXTS.badges.large.key, undefined, TEXTS.badges.large.default), variant: "primary", size: "lg" }),
      ),
    ),

    // 7. Notificaciones Toast
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t(TEXTS.toasts.section.key, undefined, TEXTS.toasts.section.default)),
      div(
        { class: "flex flex-wrap gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "primary",
            onclick: () => toast.success(i18n.raw(TEXTS.toasts.successMsg.key, undefined, TEXTS.toasts.successMsg.default), { title: i18n.raw(TEXTS.toasts.successTitle.key, undefined, TEXTS.toasts.successTitle.default) }),
          },
          i18n.t(TEXTS.toasts.successBtn.key, undefined, TEXTS.toasts.successBtn.default),
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => toast.info(i18n.raw(TEXTS.toasts.infoMsg.key, undefined, TEXTS.toasts.infoMsg.default), { title: i18n.raw(TEXTS.toasts.infoTitle.key, undefined, TEXTS.toasts.infoTitle.default) }),
          },
          i18n.t(TEXTS.toasts.infoBtn.key, undefined, TEXTS.toasts.infoBtn.default),
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => toast.warning(i18n.raw(TEXTS.toasts.warningMsg.key, undefined, TEXTS.toasts.warningMsg.default), { title: i18n.raw(TEXTS.toasts.warningTitle.key, undefined, TEXTS.toasts.warningTitle.default) }),
          },
          i18n.t(TEXTS.toasts.warningBtn.key, undefined, TEXTS.toasts.warningBtn.default),
        ),
        Button(
          {
            variant: "destructive",
            onclick: () => toast.error(i18n.raw(TEXTS.toasts.errorMsg.key, undefined, TEXTS.toasts.errorMsg.default), { title: i18n.raw(TEXTS.toasts.errorTitle.key, undefined, TEXTS.toasts.errorTitle.default) }),
          },
          i18n.t(TEXTS.toasts.errorBtn.key, undefined, TEXTS.toasts.errorBtn.default),
        ),
      ),
    ),

    // 8. Modal Clásico & Spinner
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t(TEXTS.modal.section.key, undefined, TEXTS.modal.section.default)),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm space-y-5" },
        div(
          { class: "flex flex-wrap items-center gap-4" },
          Button(
            {
              variant: "secondary",
              onclick: () => {
                modal.set({
                  header: () => div({ class: "text-lg font-bold" }, i18n.raw(TEXTS.modal.title.key, undefined, TEXTS.modal.title.default)),
                  body: () => div({ class: "py-2 text-sm text-foreground-soft leading-relaxed" }, i18n.raw(TEXTS.modal.body.key, undefined, TEXTS.modal.body.default)),
                  footer: () =>
                    div(
                      { class: "flex justify-end gap-2" },
                      Button(
                        {
                          variant: "secondary",
                          onclick: () => modal.close(),
                        },
                        i18n.raw(TEXTS.modal.close.key, undefined, TEXTS.modal.close.default),
                      ),
                      Button(
                        {
                          variant: "primary",
                          onclick: () => {
                            modal.close();
                            toast.success(i18n.raw(TEXTS.modal.confirmedToast.key, undefined, TEXTS.modal.confirmedToast.default));
                          },
                        },
                        i18n.raw(TEXTS.modal.accept.key, undefined, TEXTS.modal.accept.default),
                      ),
                    ),
                });
                modal.open();
              },
            },
            i18n.t(TEXTS.modal.openBtn.key, undefined, TEXTS.modal.openBtn.default),
          ),
        ),
        // Spin en su propia franja centrada: junto al botón se veía descolgado.
        div(
          { class: "flex justify-center rounded-xl border border-border/60 bg-secondary/10" },
          Spin(i18n.t(TEXTS.modal.spinMsg.key, undefined, TEXTS.modal.spinMsg.default)),
        ),
      ),
      modal.dom(),
    ),

    // 9. Dashboard Layout & Sidebars (VanUI AppShell)
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t(TEXTS.layouts.section.key, undefined, TEXTS.layouts.section.default)),
      p(
        { class: "text-sm text-foreground-soft" },
        i18n.t(TEXTS.layouts.desc.key, undefined, TEXTS.layouts.desc.default),
      ),
      div(
        { class: "p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4" },
        div(
          { class: "grid grid-cols-1 sm:grid-cols-3 gap-4" },
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "📱"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t(TEXTS.layouts.mobileDrawerTitle.key, undefined, TEXTS.layouts.mobileDrawerTitle.default)),
            p({ class: "text-xs text-muted-foreground" }, i18n.t(TEXTS.layouts.mobileDrawerDesc.key, undefined, TEXTS.layouts.mobileDrawerDesc.default)),
          ),
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "🖥️"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t(TEXTS.layouts.desktopSidebarTitle.key, undefined, TEXTS.layouts.desktopSidebarTitle.default)),
            p({ class: "text-xs text-muted-foreground" }, i18n.t(TEXTS.layouts.desktopSidebarDesc.key, undefined, TEXTS.layouts.desktopSidebarDesc.default)),
          ),
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "🧭"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t(TEXTS.layouts.headerSyncTitle.key, undefined, TEXTS.layouts.headerSyncTitle.default)),
            p({ class: "text-xs text-muted-foreground" }, i18n.t(TEXTS.layouts.headerSyncDesc.key, undefined, TEXTS.layouts.headerSyncDesc.default)),
          ),
        ),
      ),
    ),
  );
}
