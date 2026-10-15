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
  Form,
  Checkbox,
  Switch,
  RadioGroup,
  TextareaField,
  Alert,
  Progress,
  Skeleton,
  EmptyState,
  Tooltip,
  Popover,
  Drawer,
  Avatar,
  Breadcrumbs,
  Card,
  CardTitle,
  Accordion,
  Combobox,
  Pagination,
  Kbd,
  fmt,
  raw,
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

  // Controles de formulario (Fase 1 del roadmap)
  const demoTerms = van.state(false);
  const demoProgress = van.state(65);
  const demoDrawerRight = van.state(false);
  const demoCountry = van.state("");
  // fmt: States creados UNA vez (sin memoización, igual que t())
  const fmtDate = fmt.date(new Date(2026, 9, 15, 14, 30));
  const fmtTime = fmt.time(new Date(2026, 9, 15, 14, 30));
  const fmtPrice = fmt.currency(49.99, { minimumFractionDigits: 2 });
  const fmtTax = fmt.percent(0.21);
  const fmtUpdated = fmt.relative(-2, "hour");
  const demoPage = van.state(2);
  const demoLangs = van.state<string[]>(["es", "fr"]);
  const langsSummary = van.derive(() => {
    const names: Record<string, string> = {
      es: raw("components.langEs", "Español"),
      en: raw("components.langEn", "Inglés"),
      fr: raw("components.langFr", "Francés"),
      de: raw("components.langDe", "Alemán"),
    };
    const list = demoLangs.val.map((v) => names[v] ?? v).join(", ");
    return raw("components.langsSelected", "Seleccionados: {list}", { list: list || "—" });
  });
  const pageSummary = van.derive(() =>
    raw("components.pageOf", "Página {n} de {total}", { n: demoPage.val, total: 12 }),
  );
  const countrySummary = van.derive(() => {
    const names: Record<string, string> = {
      ar: raw("components.countryAr", "Argentina"),
      bo: raw("components.countryBo", "Bolivia"),
      co: raw("components.countryCo", "Colombia"),
      mx: raw("components.countryMx", "México"),
    };
    const name = names[demoCountry.val];
    return raw("components.countrySelected", "País seleccionado: {name}", { name: name ?? "—" });
  });
  const demoDrawerBottom = van.state(false);
  const demoPlan = van.state("pro");
  const planSummary = van.derive(() => {
    const names: Record<string, string> = {
      basic: raw("components.planBasic", "Básico"),
      pro: raw("components.planPro", "Pro"),
      business: raw("components.planBusiness", "Empresarial"),
    };
    return raw("components.planSelected", "Plan seleccionado: {name}", { name: names[demoPlan.val] ?? "—" });
  });

  const demoMessage = TextareaField({
    name: "demo-message",
    label: i18n.t("components.textareaLabel", "Mensaje"),
    placeholder: i18n.t("components.textareaPlaceholder", "Cuéntanos más sobre tu proyecto..."),
    rows: 3,
  });
  const demoAccept = Checkbox({
    name: "demo-form-terms",
    label: i18n.t("components.checkTerms", "Acepto los términos y condiciones"),
    required: true,
  });
  const demoForm = Form(() => {
    toast.success(raw("components.formSent", "¡Formulario enviado con éxito!"));
  });
  demoForm.add(demoMessage, demoAccept);
  const formDemo = demoForm.dom(
    Button({ type: "submit" }, i18n.t("components.formSubmit", "Enviar")),
  );

  const columns: TableColumn<SampleUser>[] = [
    { key: "name", header: i18n.t("components.colUser", "Usuario"), sortable: true },
    { key: "role", header: i18n.t("components.colRole", "Rol"), sortable: true },
    {
      key: "status",
      header: i18n.t("components.colStatus", "Estado"),
      sortable: true,
      render: (row) => {
        const variantMap: Record<SampleUser["status"], "success" | "warning" | "danger"> = {
          active: "success",
          pending: "warning",
          suspended: "danger",
        };
        const textMap = {
          active: i18n.t("components.statusActive", "Activo"),
          pending: i18n.t("components.statusPending", "Pendiente"),
          suspended: i18n.t("components.statusSuspended", "Suspendido"),
        };
        return Badge({
          variant: variantMap[row.status],
          text: textMap[row.status],
          dot: true,
          size: "sm",
        });
      },
    },
    { key: "created", header: i18n.t("components.colCreated", "Fecha Alta"), sortable: true, align: "right" },
  ];

  return div(
    {
      id: "components-page",
      class: "space-y-12 py-4",
    },
    // Cabecera Principal
    div(
      { class: "border-b border-border pb-5" },
      h1({ class: "text-3xl font-extrabold text-foreground" }, i18n.t("components.title", "Catálogo de Componentes")),
      p({ class: "text-foreground-soft text-sm mt-1" }, i18n.t("components.subtitle", "Componentes interactivos construidos con VanJS y VanUI")),
    ),

    // 1. Theme & i18n Control Section (Componentes Embebidos de VanUI)
    section(
      { class: "space-y-5 p-6 rounded-2xl border border-border bg-secondary/10 shadow-sm" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-lg font-bold text-foreground" }, i18n.t("components.themeSection", "Gestión de Tema e Idioma")),
        Badge({ text: i18n.t("components.embeddedBadge", "Embebidos en VanUI"), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.themeDesc", "Gestión de estado global sin overhead: alternancia instantánea y sincronización automática.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-2" },
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.themeToggleDemo", "ThemeToggle (Botón y Segmentado)")),
          div(
            { class: "flex flex-wrap items-center gap-3" },
            ThemeToggle({ theme, i18n, showLabel: true }),
            ThemeToggle({ theme, i18n, variant: "segmented" }),
          ),
        ),
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.localeSelectorDemo", "LocaleSelector (Select y Botones)")),
          div(
            { class: "flex flex-wrap items-center gap-3" },
            LocaleSelector({ i18n }),
            LocaleSelector({ i18n, variant: "buttons" }),
          ),
        ),
      ),
    ),

    // 2. Controles de Formulario (Checkbox / Switch / RadioGroup / Textarea)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.formControls", "Controles de Formulario")),
        Badge({ text: i18n.t("components.newBadge", "Nuevo"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.formControlsDesc", "Controles binarios y multilínea con estado reactivo, navegación por teclado e integración nativa con Form.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        // Checkbox
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.checkboxCard", "Checkbox")),
          Checkbox({
            name: "demo-newsletter",
            label: i18n.t("components.checkNewsletter", "Suscribirme al boletín"),
            description: i18n.t("components.checkNewsletterDesc", "Recibirás como máximo un correo al mes"),
          }).dom(),
          Checkbox({
            name: "demo-terms",
            label: i18n.t("components.checkTerms", "Acepto los términos y condiciones"),
            checked: demoTerms,
            size: "lg",
          }).dom(),
          Checkbox({
            name: "demo-disabled",
            label: i18n.t("components.checkDisabled", "Opción deshabilitada"),
            disabled: true,
          }).dom(),
        ),
        // Switch
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.switchCard", "Switch")),
          Switch({ name: "demo-switch-sm", size: "sm", label: i18n.t("components.switchCompact", "Compacto") }).dom(),
          Switch({ name: "demo-switch-md", size: "md", label: i18n.t("components.switchEmails", "Notificaciones por correo") }).dom(),
          Switch({ name: "demo-switch-lg", size: "lg", label: i18n.t("components.switchAuto", "Actualizaciones automáticas") }).dom(),
        ),
        // RadioGroup
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.radioCard", "RadioGroup")),
          RadioGroup({
            name: "demo-plan",
            value: demoPlan,
            ariaLabel: i18n.t("components.radioCard", "RadioGroup"),
            options: [
              { value: "basic", label: i18n.t("components.planBasic", "Básico"), description: i18n.t("components.planBasicDesc", "Para proyectos personales") },
              { value: "pro", label: i18n.t("components.planPro", "Pro") },
              { value: "business", label: i18n.t("components.planBusiness", "Empresarial"), disabled: true },
            ],
          }).dom(),
          p({ class: "text-xs text-foreground-soft" }, planSummary),
        ),
        // Form + Textarea
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.formCard", "Form + Textarea")),
          formDemo,
        ),
      ),
    ),

    // 3. Estados y Feedback (Alert / Progress / Skeleton / EmptyState)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.feedbackSection", "Estados y Feedback")),
        Badge({ text: i18n.t("components.newBadge", "Nuevo"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.feedbackDesc", "Avisos persistentes, barras de progreso reactivas, placeholders de carga y estados vacíos.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        // Alert
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.alertCard", "Alert")),
          Alert(
            { variant: "info", title: i18n.t("components.alertInfoTitle", "Novedades") },
            i18n.t("components.alertInfoBody", "La Fase 2 del roadmap ya está disponible."),
          ),
          Alert(
            { variant: "success", title: i18n.t("components.alertSuccessTitle", "Guardado") },
            i18n.t("components.alertSuccessBody", "Tus cambios quedaron aplicados."),
          ),
          Alert({ variant: "warning" }, i18n.t("components.alertWarningBody", "Tu sesión expirará en 5 minutos.")),
          Alert(
            {
              variant: "error",
              title: i18n.t("components.alertErrorTitle", "Error de conexión"),
              dismissible: true,
              onDismiss: () => toast.info(raw("components.alertDismissed", "Aviso descartado")),
            },
            i18n.t("components.alertErrorBody", "No pudimos sincronizar; reintenta cuando quieras."),
          ),
        ),
        // Progress
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-4" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.progressCard", "Progress")),
          Progress({ value: demoProgress, label: i18n.t("components.uploadLabel", "Subiendo archivos...") }),
          Progress({ indeterminate: true, label: i18n.t("components.syncLabel", "Sincronizando cambios") }),
          div(
            { class: "flex gap-2" },
            Button(
              { variant: "secondary", size: "sm", onclick: () => (demoProgress.val = Math.max(0, demoProgress.val - 10)) },
              i18n.t("components.less", "Menos"),
            ),
            Button(
              { variant: "secondary", size: "sm", onclick: () => (demoProgress.val = Math.min(100, demoProgress.val + 10)) },
              i18n.t("components.more", "Más"),
            ),
          ),
        ),
        // Skeleton
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-4" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.skeletonCard", "Skeleton")),
          div(
            { class: "flex items-start gap-3" },
            Skeleton({ variant: "circle" }),
            Skeleton({ lines: 3 }),
          ),
          Skeleton({ variant: "block" }),
        ),
        // EmptyState
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.emptyCard", "EmptyState")),
          EmptyState({
            icon: "🔍",
            title: i18n.t("components.emptyTitle", "Sin resultados"),
            description: i18n.t("components.emptyDesc", "Prueba con otros términos o crea un nuevo registro."),
            action: Button(
              { variant: "secondary", size: "sm" },
              i18n.t("components.emptyAction", "Crear registro"),
            ),
          }),
        ),
      ),
    ),

    // 4. Overlay fino (Tooltip / Popover / Drawer)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.overlaySection", "Overlay fino")),
        Badge({ text: i18n.t("components.newBadge", "Nuevo"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.overlayDesc", "Tooltips accesibles, paneles flotantes y drawers con foco atrapado y bloqueo de scroll.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        // Tooltip
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.tooltipCard", "Tooltip")),
          div(
            { class: "flex flex-wrap gap-2" },
            Tooltip(
              { content: i18n.t("components.tipTop", "Aparece arriba") },
              Button({ variant: "secondary", size: "sm" }, i18n.t("components.tipTopBtn", "Arriba")),
            ),
            Tooltip(
              { content: i18n.t("components.tipBottom", "Aparece abajo"), position: "bottom" },
              Button({ variant: "secondary", size: "sm" }, i18n.t("components.tipBottomBtn", "Abajo")),
            ),
            Tooltip(
              { content: i18n.t("components.tipRight", "Aparece a la derecha"), position: "right" },
              Button({ variant: "secondary", size: "sm" }, i18n.t("components.tipRightBtn", "Derecha")),
            ),
          ),
          p({ class: "text-xs text-foreground-soft" }, i18n.t("components.tipFocusHint", "También aparecen al enfocar con Tab (accesible por teclado).")),
        ),
        // Popover
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.popoverCard", "Popover")),
          Popover({
            trigger: Button({ variant: "secondary", size: "sm" }, i18n.t("components.popoverTrigger", "Opciones")),
            ariaLabel: i18n.t("components.popoverCard", "Popover"),
            content: (close) =>
              div(
                { class: "space-y-3 text-sm" },
                p({ class: "text-foreground-soft" }, i18n.t("components.popoverBody", "Panel flotante con contenido arbitrario. Se cierra con Esc o click fuera.")),
                div(
                  { class: "flex gap-2" },
                  Button(
                    { size: "sm", onclick: () => toast.success(raw("components.popoverApplied", "¡Aplicado!")) },
                    i18n.t("components.popoverApply", "Aplicar"),
                  ),
                  Button({ variant: "secondary", size: "sm", onclick: close }, i18n.t("components.popoverClose", "Cerrar")),
                ),
              ),
          }),
        ),
        // Drawer
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.drawerCard", "Drawer")),
          div(
            { class: "flex flex-wrap gap-2" },
            Button(
              { size: "sm", onclick: () => (demoDrawerRight.val = true) },
              i18n.t("components.drawerSideBtn", "Panel lateral"),
            ),
            Button(
              { variant: "secondary", size: "sm", onclick: () => (demoDrawerBottom.val = true) },
              i18n.t("components.drawerBottomBtn", "Panel inferior"),
            ),
          ),
          p({ class: "text-xs text-foreground-soft" }, i18n.t("components.drawerHint", "Esc, backdrop o el botón × lo cierran; el foco vuelve al origen.")),
        ),
      ),
      // Drawers (posicionamiento fijo; viven aquí pero cubren la pantalla)
      Drawer(
        { open: demoDrawerRight, side: "right", class: "w-96" },
        div(
          { class: "p-6 pt-12 space-y-3 text-sm" },
          h3({ class: "text-base font-bold text-foreground" }, i18n.t("components.drawerTitle", "Panel lateral")),
          p({ class: "text-foreground-soft" }, i18n.t("components.drawerBody", "El drawer bloquea el scroll de la página, atrapa el foco (Tab no escapa) y lo devuelve al elemento que lo abrió.")),
          Button(
            { onclick: () => (demoDrawerRight.val = false) },
            i18n.t("components.drawerOk", "Entendido"),
          ),
        ),
      ),
      Drawer(
        { open: demoDrawerBottom, side: "bottom" },
        div(
          { class: "p-6 pt-12 space-y-3 text-sm" },
          h3({ class: "text-base font-bold text-foreground" }, i18n.t("components.drawerBottomTitle", "Panel inferior")),
          p({ class: "text-foreground-soft" }, i18n.t("components.drawerBody", "El drawer bloquea el scroll de la página, atrapa el foco (Tab no escapa) y lo devuelve al elemento que lo abrió.")),
          Button(
            { onclick: () => (demoDrawerBottom.val = false) },
            i18n.t("components.drawerOk", "Entendido"),
          ),
        ),
      ),
    ),

    // 5. Escala y pulido (Avatar / Breadcrumbs / Card / Accordion / Combobox)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.polishSection", "Escala y pulido")),
        Badge({ text: i18n.t("components.newBadge", "Nuevo"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.polishDesc", "Avatar con fallback de iniciales, ruta de navegación, tarjetas, acordeón y combobox con búsqueda por teclado.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        // Avatar + Breadcrumbs
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-4" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.avatarBreadcrumbsCard", "Avatar & Breadcrumbs")),
          div(
            { class: "flex items-center gap-3" },
            Avatar({ name: i18n.t("components.avatarName", "Ana Morales"), size: "xs" }),
            Avatar({ name: i18n.t("components.avatarName", "Ana Morales"), size: "sm" }),
            Avatar({ name: i18n.t("components.avatarName", "Ana Morales"), size: "md" }),
            Avatar({ name: i18n.t("components.avatarName", "Ana Morales"), size: "lg", src: "/favicon.svg" }),
            Avatar({ name: i18n.t("components.avatarNoName", "?"), size: "md" }),
          ),
          p({ class: "text-xs text-foreground-soft" }, i18n.t("components.avatarHint", "El último usa una imagen que falla: rota solo a iniciales.")),
          Breadcrumbs({
            items: [
              { label: i18n.t("components.bcHome", "Inicio"), href: "/" },
              { label: i18n.t("components.bcComponents", "Componentes"), href: "/components" },
              { label: i18n.t("components.bcHere", "Estás aquí") },
            ],
          }),
        ),
        // Card
        div(
          { class: "space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.cardCard", "Card")),
          Card(
            { class: "p-5 space-y-2", hoverable: true },
            CardTitle({}, i18n.t("components.cardTitle", "Tarjeta compuesta")),
            p({ class: "text-sm text-foreground-soft" }, i18n.t("components.cardBody", "La Card no incluye padding: el consumidor decide (aquí p-5). Con hoverable suma sombra al pasar el mouse.")),
            Badge({ text: i18n.t("components.cardBadge", "Demo"), variant: "outline", size: "sm" }),
          ),
        ),
        // Accordion
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.accordionCard", "Accordion")),
          Accordion({
            items: [
              {
                id: "what",
                title: i18n.t("components.acc1Title", "¿Qué es VanUI?"),
                content: () => van.tags.p(i18n.t("components.acc1Body", "Una librería de componentes reactivos para VanJS: cero boilerplate, i18n inline y baterías incluidas.")),
              },
              {
                id: "how",
                title: i18n.t("components.acc2Title", "¿El contenido se reconstruye?"),
                content: () => van.tags.p(i18n.t("components.acc2Body", "Sí: la fábrica de contenido se invoca en cada apertura, así que los bindings siempre están frescos.")),
              },
              {
                id: "kbd",
                title: i18n.t("components.acc3Title", "¿Y el teclado?"),
                content: () => van.tags.p(i18n.t("components.acc3Body", "Cada cabecera es un botón con aria-expanded y su panel es una región etiquetada.")),
              },
            ],
          }),
        ),
        // Combobox
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.comboboxCard", "Combobox")),
          Combobox({
            name: "demo-country",
            value: demoCountry,
            options: [
              { value: "ar", label: i18n.t("components.countryAr", "Argentina") },
              { value: "bo", label: i18n.t("components.countryBo", "Bolivia") },
              { value: "co", label: i18n.t("components.countryCo", "Colombia") },
              { value: "mx", label: i18n.t("components.countryMx", "México") },
            ],
          }).dom(),
          p({ class: "text-xs text-foreground-soft" }, countrySummary),
          p({ class: "text-xs text-muted-foreground" }, i18n.t("components.comboboxHint", "Teclea para filtrar; ↑/↓ navegan, Enter selecciona, Esc cierra.")),
        ),
        // fmt (formato locale-aware)
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.fmtCard", "fmt (formato por idioma)")),
          div(
            { class: "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm" },
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtDateLabel", "Fecha")),
            span({ class: "text-foreground font-medium" }, fmtDate),
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtTimeLabel", "Hora")),
            span({ class: "text-foreground font-medium" }, fmtTime),
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtPriceLabel", "Precio")),
            span({ class: "text-foreground font-medium" }, fmtPrice),
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtTaxLabel", "IVA")),
            span({ class: "text-foreground font-medium" }, fmtTax),
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtUpdatedLabel", "Actualizado")),
            span({ class: "text-foreground font-medium" }, fmtUpdated),
          ),
          p({ class: "text-xs text-foreground-soft" }, i18n.t("components.fmtHint", "Cambia el idioma arriba: los valores se reformatean solos.")),
        ),
        // Pagination & Kbd
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.paginationCard", "Pagination & Kbd")),
          Pagination({ page: demoPage, totalPages: 12 }),
          p({ class: "text-xs text-foreground-soft" }, pageSummary),
          div(
            { class: "flex items-center gap-2 text-sm text-foreground-soft" },
            span(i18n.t("components.kbdHint", "Atajos:")),
            Kbd({ size: "sm" }, "⌘"),
            Kbd({ size: "sm" }, "K"),
          ),
        ),
        // Combobox multiple
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.langsLabel", "Idiomas (multiple)")),
          Combobox({
            name: "demo-langs",
            multiple: true,
            value: demoLangs,
            options: [
              { value: "es", label: i18n.t("components.langEs", "Español") },
              { value: "en", label: i18n.t("components.langEn", "Inglés") },
              { value: "fr", label: i18n.t("components.langFr", "Francés") },
              { value: "de", label: i18n.t("components.langDe", "Alemán") },
            ],
          }).dom(),
          p({ class: "text-xs text-foreground-soft" }, langsSummary),
          p({ class: "text-xs text-muted-foreground" }, i18n.t("components.comboboxHint", "Teclea para filtrar; ↑/↓ navegan, Enter selecciona, Esc cierra.")),
        ),
      ),
    ),

    // 6. Tabs (Pestañas accesibles y reactivas)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.tabs", "Pestañas (Tabs)")),
        Badge({ text: i18n.t("components.accessibleBadge", "Accesible ARIA"), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.tabsDesc", "Organiza contenido denso con soporte para flechas de teclado (←/→, Home, End), badges y múltiples variantes.")),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm space-y-6" },
        // Variante Underline
        Tabs({
          id: "demo-tabs-underline",
          variant: "underline",
          items: [
            {
              id: "overview",
              label: i18n.t("components.tabOverview", "Resumen General"),
              badge: i18n.t("components.tabOverviewBadge", "Nuevo"),
              content: () =>
                div(
                  { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                  h3({ class: "font-bold text-foreground text-base" }, i18n.t("components.perfTitle", "📊 Panel de Rendimiento")),
                  p({ class: "text-foreground-soft leading-relaxed" }, i18n.t("components.perfBody", "VanUI permite renderizar vistas SPA reactivas con un bundle ultra liviano (~1.5kB de VanJS core) sin VDOM.")),
                ),
            },
            {
              id: "activity",
              label: i18n.t("components.tabActivity", "Actividad"),
              badge: 4,
              content: () =>
                div(
                  { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                  h3({ class: "font-bold text-foreground text-base" }, i18n.t("components.eventsTitle", "⚡ Registro de Eventos")),
                  p({ class: "text-foreground-soft" }, i18n.t("components.eventsBody", "Se registraron 4 operaciones exitosas en las últimas 24 horas.")),
                ),
            },
            {
              id: "security",
              label: i18n.t("components.tabSecurity", "Seguridad"),
              content: () =>
                div(
                  { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                  h3({ class: "font-bold text-foreground text-base" }, i18n.t("components.securityTitle", "🔒 Autenticación y Cifrado")),
                  p({ class: "text-foreground-soft" }, i18n.t("components.securityBody", "Sesiones protegidas con guards síncronos y asíncronos en el enrutador SPA.")),
                ),
            },
            {
              id: "disabled-tab",
              label: i18n.t("components.tabDisabled", "Deshabilitado"),
              disabled: true,
              content: () => div(i18n.t("components.disabledContent", "No accesible")),
            },
          ],
        }),
      ),
    ),

    // 7. Select / Dropdowns Accesibles
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.dropdowns", "Select y Dropdowns Accesibles")),
        Badge({ text: i18n.t("components.listboxBadge", "Listbox + Menú"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.dropdownsDesc", "Selectores personalizados con navegación completa por teclado, búsqueda integrada y menús de acciones contextuales.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        // Select con búsqueda
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.searchSelect", "Select con Búsqueda")),
          SelectDropdown({
            id: "framework-select",
            searchable: true,
            searchPlaceholder: i18n.t("components.selectSearchPlaceholder", "Buscar framework..."),
            value: selectedFramework,
            options: [
              { value: "vanjs", label: "VanJS", description: i18n.t("components.frameworkVanjs", "Ultra lightweight (1.0kB)") },
              { value: "react", label: "React", description: i18n.t("components.frameworkReact", "Popular ecosystem") },
              { value: "vue", label: "Vue", description: i18n.t("components.frameworkVue", "Progressive framework") },
              { value: "svelte", label: "Svelte", description: i18n.t("components.frameworkSvelte", "Cybernetically enhanced") },
            ],
            onChange: (val) => toast.info(i18n.raw("components.selectedToast", "Seleccionado: {val}", { val })),
          }),
          p(
            { class: "text-xs text-muted" },
            // raw() lee currentLocale.val dentro del binding: reacciona al idioma y al valor.
            () => i18n.raw("components.currentValue", "Valor actual: {val}", { val: selectedFramework.val }),
          ),
        ),

        // Select de Países
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.countrySelect", "Selector con Iconos")),
          SelectDropdown({
            id: "country-select",
            value: selectedCountry,
            options: [
              { value: "es", label: i18n.t("components.countryEs", "España"), icon: span("🇪🇸") },
              { value: "us", label: i18n.t("components.countryUs", "Estados Unidos"), icon: span("🇺🇸") },
              { value: "fr", label: i18n.t("components.countryFr", "Francia"), icon: span("🇫🇷") },
              { value: "mx", label: i18n.t("components.countryMx", "México"), icon: span("🇲🇽") },
              { value: "ar", label: i18n.t("components.countryAr", "Argentina"), icon: span("🇦🇷") },
            ],
            onChange: (val) => toast.info(i18n.raw("components.countryToast", "País seleccionado: {val}", { val })),
          }),
        ),

        // DropdownMenu contextual
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.actionsMenu", "Menú de Acciones")),
          div(
            { class: "pt-1" },
            DropdownMenu({
              trigger: (isOpen) =>
                Button(
                  { variant: "secondary" },
                  div({ class: "flex items-center gap-2" }, span(i18n.t("components.actionsLabel", "Acciones")), span({ class: () => isOpen.val ? "rotate-180 transition-transform" : "transition-transform" }, "▾")),
                ),
              items: [
                { type: "header", label: i18n.raw("components.accountHeader", "Opciones de cuenta") },
                { label: i18n.t("components.viewProfile", "Ver Perfil"), icon: span("👤"), onClick: () => toast.info(i18n.raw("components.profileToast", "Navegando al perfil")) },
                { label: i18n.t("components.settings", "Configuración"), icon: span("⚙️"), badge: "Pro", onClick: () => toast.info(i18n.raw("components.settingsToast", "Abriendo configuración")) },
                { type: "divider" },
                { label: i18n.t("components.signOut", "Cerrar Sesión"), icon: span("🚪"), destructive: true, onClick: () => toast.warning(i18n.raw("components.signOutToast", "Sesión cerrada")) },
              ],
            }),
          ),
        ),
      ),
    ),

    // 8. ConfirmDialog (Diálogos de confirmación)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.confirmDialogs", "Diálogos de Confirmación (ConfirmDialog)")),
        Badge({ text: i18n.t("components.imperativeBadge", "Imperativo & Declarativo"), variant: "warning", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.confirmDesc", "Abstracción sobre Modal para confirmaciones críticas con soporte para Promises, estados de carga y variantes.")),
      div(
        { class: "flex flex-wrap items-center gap-4 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "destructive",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: i18n.raw("components.deleteTitle", "¿Eliminar cuenta permanentemente?"),
                message: i18n.raw("components.deleteMsg", "Esta acción borrará todos tus datos y transacciones asociadas sin posibilidad de recuperación."),
                variant: "danger",
                confirmText: i18n.raw("components.deleteConfirm", "Sí, eliminar cuenta"),
                cancelText: i18n.raw("components.cancel", "Cancelar"),
              });

              if (confirmed) {
                toast.error(i18n.raw("components.deletedToast", "Cuenta eliminada satisfactoriamente"));
              } else {
                toast.info(i18n.raw("components.cancelledToast", "Acción cancelada por el usuario"));
              }
            },
          },
          i18n.t("components.dangerBtn", "🗑️ Diálogo Peligroso (Imperativo)"),
        ),
        Button(
          {
            variant: "secondary",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: i18n.raw("components.publishTitle", "¿Publicar cambios?"),
                message: i18n.raw("components.publishMsg", "Los cambios se aplicarán inmediatamente a todos los usuarios en producción."),
                variant: "primary",
                confirmText: i18n.raw("components.publishConfirm", "Publicar ahora"),
              });

              if (confirmed) {
                toast.success(i18n.raw("components.publishedToast", "Cambios publicados en producción"));
              }
            },
          },
          i18n.t("components.infoBtn", "🚀 Diálogo Informativo"),
        ),
      ),
    ),

    // 9. DataGrid / Table con búsqueda, ordenamiento y selección
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.tables", "Tablas y DataGrid")),
        Badge({ text: i18n.t("components.searchSortBadge", "Búsqueda + Sort + Paginación"), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.tablesDesc", "Tabla de datos reactiva con ordenamiento bidireccional por columna, búsqueda instantánea, selección múltiple y paginación.")),
      DataGrid({
        columns,
        data: sampleUsers,
        pageSize: 4,
        searchable: true,
        searchPlaceholder: i18n.t("components.tableSearchPlaceholder", "Buscar por nombre o rol..."),
        selectable: true,
        selectedRows: selectedUsers,
        onSelectionChange: (selected) => {
          if (selected.length > 0) {
            toast.info(i18n.raw("components.usersSelected", "{n} usuarios seleccionados", { n: selected.length }), { durationMs: 1500 });
          }
        },
      }),
    ),

    // 10. Badges & Toasts
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.badges", "Etiquetas (Badges)")),
      div(
        { class: "flex flex-wrap items-center gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Badge({ text: i18n.t("components.badgePrimary", "Primario"), variant: "primary" }),
        Badge({ text: i18n.t("components.badgeSuccess", "Éxito"), variant: "success", dot: true }),
        Badge({ text: i18n.t("components.badgeWarning", "Advertencia"), variant: "warning", dot: true }),
        Badge({ text: i18n.t("components.badgeDanger", "Peligro"), variant: "danger", dot: true }),
        Badge({ text: i18n.t("components.badgeSecondary", "Secundario"), variant: "secondary" }),
        Badge({ text: i18n.t("components.badgeOutline", "Contorno"), variant: "outline" }),
        Badge({ text: i18n.t("components.badgeLarge", "Grande"), variant: "primary", size: "lg" }),
      ),
    ),

    // 11. Notificaciones Toast
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.toasts", "Notificaciones (Toast)")),
      div(
        { class: "flex flex-wrap gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "primary",
            onclick: () => toast.success(i18n.raw("components.toastSuccessMsg", "Operación realizada con éxito"), { title: i18n.raw("components.toastSuccessTitle", "Completado") }),
          },
          i18n.t("components.toastSuccessBtn", "Éxito"),
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => toast.info(i18n.raw("components.toastInfoMsg", "Hay una nueva actualización disponible"), { title: i18n.raw("components.toastInfoTitle", "Novedad") }),
          },
          i18n.t("components.toastInfoBtn", "Información"),
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => toast.warning(i18n.raw("components.toastWarningMsg", "La sesión expirará en 5 minutos"), { title: i18n.raw("components.toastWarningTitle", "Aviso") }),
          },
          i18n.t("components.toastWarningBtn", "Advertencia"),
        ),
        Button(
          {
            variant: "destructive",
            onclick: () => toast.error(i18n.raw("components.toastErrorMsg", "No se pudo conectar con el servidor"), { title: i18n.raw("components.toastErrorTitle", "Fallo") }),
          },
          i18n.t("components.toastErrorBtn", "Error"),
        ),
      ),
    ),

    // 12. Modal Clásico & Spinner
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.modals", "Modales")),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm space-y-5" },
        div(
          { class: "flex flex-wrap items-center gap-4" },
          Button(
            {
              variant: "secondary",
              onclick: () => {
                modal.set({
                  header: () => div({ class: "text-lg font-bold" }, i18n.raw("components.modalTitle", "Modal Básico VanUI")),
                  body: () => div({ class: "py-2 text-sm text-foreground-soft leading-relaxed" }, i18n.raw("components.modalBody", "Este modal es completamente reactivo y se monta/desmonta con estados nativos de VanJS.")),
                  footer: () =>
                    div(
                      { class: "flex justify-end gap-2" },
                      Button(
                        {
                          variant: "secondary",
                          onclick: () => modal.close(),
                        },
                        i18n.raw("components.modalClose", "Cerrar"),
                      ),
                      Button(
                        {
                          variant: "primary",
                          onclick: () => {
                            modal.close();
                            toast.success(i18n.raw("components.modalConfirmedToast", "Acción confirmada desde el modal"));
                          },
                        },
                        i18n.raw("components.modalAccept", "Aceptar"),
                      ),
                    ),
                });
                modal.open();
              },
            },
            i18n.t("components.openModalBtn", "Abrir Modal Básico"),
          ),
        ),
        // Spin en su propia franja centrada: junto al botón se veía descolgado.
        div(
          { class: "flex justify-center rounded-xl border border-border/60 bg-secondary/10" },
          Spin(i18n.t("components.spinMsg", "Indicador de carga...")),
        ),
      ),
      modal.dom(),
    ),

    // 13. Dashboard Layout & Sidebars (VanUI AppShell)
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.layoutsSection", "Layouts & Dashboard Shell")),
      p(
        { class: "text-sm text-foreground-soft" },
        i18n.t("components.layoutsDesc", "Estructura adaptable Mobile-First con Drawer deslizable en pantallas táctiles y Sidebar estática en escritorio."),
      ),
      div(
        { class: "p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4" },
        div(
          { class: "grid grid-cols-1 sm:grid-cols-3 gap-4" },
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "📱"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t("components.mobileDrawerTitle", "Mobile-First Drawer")),
            p({ class: "text-xs text-muted-foreground" }, i18n.t("components.mobileDrawerDesc", "Backdrop oscurecido con desenfoque, cierre automático al seleccionar enlace y botón hamburguesa accesible.")),
          ),
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "🖥️"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t("components.desktopSidebarTitle", "Desktop Sidebar")),
            p({ class: "text-xs text-muted-foreground" }, i18n.t("components.desktopSidebarDesc", "Panel lateral persistente con soporte para grupos de navegación, íconos, badges reactivos y pie de página de usuario.")),
          ),
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "🧭"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t("components.headerSyncTitle", "HeaderBar & Router Sync")),
            p({ class: "text-xs text-muted-foreground" }, i18n.t("components.headerSyncDesc", "Sincronización automática de títulos y enlaces activos (aria-current) con el router singleton de la app.")),
          ),
        ),
      ),
    ),
  );
}
