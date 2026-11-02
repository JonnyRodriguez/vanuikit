// demo/pages/components.page.ts
import {
  van,
  Button,
  Badge,
  DataGrid,
  DatePicker,
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
  TextField,
  EmailField,
  Wizard,
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
} from "vanuikit";
import { i18n } from "../shared/i18n.config.js";
import { theme } from "../shared/theme.config.js";
import { z } from "zod";

const { div, h1, h2, h3, p, span, section } = van.tags;

const WizardDemo = (): HTMLElement =>
  Wizard({
    steps: [
      {
        title: i18n.t("components.wizardStep1", "Listing details"),
        schema: z.object({
          title: z.string().min(3, i18n.raw("components.wizardTitleMin", "Title must have at least 3 characters")),
          price: z.string().min(1, i18n.raw("components.wizardPriceReq", "Enter a price")),
        }),
        fields: [
          TextField({
            name: "title",
            label: i18n.t("components.wizardTitleLabel", "Title"),
            placeholder: i18n.t("components.wizardTitlePh", "E.g. iPhone 13 128GB"),
          }),
          TextField({
            name: "price",
            label: i18n.t("components.wizardPriceLabel", "Price"),
            placeholder: i18n.t("components.wizardPricePh", "500"),
          }),
        ],
      },
      {
        title: i18n.t("components.wizardStep2", "Contact"),
        fields: [EmailField()],
      },
      {
        title: i18n.t("components.wizardStep3", "Description"),
        fields: [TextareaField({ name: "description" })],
      },
    ],
    onSubmit: async (data) => {
      // Simula el backend: re-valida con el mismo contrato (doble validación).
      await new Promise((r) => setTimeout(r, 600));
      if (!data.email || String(data.email).length < 5) {
        return {
          ok: false,
          fieldErrors: { email: i18n.raw("components.wizardEmailErr", "Invalid email (double validation)") },
        };
      }
      toast.success(raw("demo.wizard.published", "Listing published successfully"));
      return { ok: true };
    },
  }).dom();

// Demo de navegación programática (useWizard): botones externos que saltan de
// paso, validan sin avanzar y recolectan un borrador con collectStep().
const WizardProgrammaticDemo = (): HTMLElement => {
  const w = Wizard({
    steps: [
      {
        title: i18n.t("components.wzPgStep1", "Listing details"),
        schema: z.object({
          title: z.string().min(3, i18n.raw("components.wzPgTitleMin", "Title must have at least 3 characters")),
          price: z.string().min(1, i18n.raw("components.wzPgPriceReq", "Enter a price")),
        }),
        fields: [
          TextField({
            name: "title",
            label: i18n.t("components.wzPgTitleLabel", "Title"),
            placeholder: i18n.t("components.wzPgTitlePh", "E.g. iPhone 13 128GB"),
          }),
          TextField({
            name: "price",
            label: i18n.t("components.wzPgPriceLabel", "Price"),
            placeholder: i18n.t("components.wzPgPricePh", "500"),
          }),
        ],
      },
      {
        title: i18n.t("components.wzPgStep2", "Contact"),
        fields: [EmailField()],
      },
      {
        title: i18n.t("components.wzPgStep3", "Description"),
        fields: [TextareaField({ name: "description" })],
      },
    ],
    onSubmit: async (data) => {
      await new Promise((r) => setTimeout(r, 400));
      if (!data.email || String(data.email).length < 5) {
        return {
          ok: false,
          fieldErrors: { email: i18n.raw("components.wzPgEmailErr", "Invalid email") },
        };
      }
      toast.success(raw("components.wzPgPublished", "Ad published successfully"));
      return { ok: true };
    },
  });

  // Barra externa que usa el handle del wizard (useWizard).
  const bar = div(
    { class: "flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-border" },
    Button(
      { type: "button", variant: "secondary", size: "sm", onclick: () => w.goTo(Math.max(0, w.step.val - 1)) },
      i18n.t("components.wzPgGoBack", "Jump back"),
    ),
    Button(
      { type: "button", variant: "secondary", size: "sm", onclick: () => w.goTo(Math.min(2, w.step.val + 1)) },
      i18n.t("components.wzPgGoNext", "Jump forward"),
    ),
    Button(
      {
        type: "button",
        variant: "secondary",
        size: "sm",
        onclick: () => {
          if (w.validateCurrent()) toast.success(raw("components.wzPgValidOk", "Valid step ✔"));
          else toast.error(raw("components.wzPgValidFail", "Check the fields of the current step"));
        },
      },
      i18n.t("components.wzPgValidate", "Validate step"),
    ),
    Button(
      {
        type: "button",
        variant: "secondary",
        size: "sm",
        onclick: () => {
          const draft = w.collectStep();
          const n = Object.keys(draft).length;
          toast.info(
            raw("components.wzPgDraft", "Draft of {n} field(s) captured", { n: String(n) }),
          );
        },
      },
      i18n.t("components.wzPgDraftBtn", "Save draft"),
    ),
  );

  return div({ class: "space-y-4" }, w.dom(), bar);
};

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
  const demoDate = van.state<Date | null>(new Date(2026, 0, 15));

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
      es: raw("components.langEs", "Spanish"),
      en: raw("components.langEn", "English"),
      fr: raw("components.langFr", "French"),
      de: raw("components.langDe", "German"),
    };
    const list = demoLangs.val.map((v) => names[v] ?? v).join(", ");
    return raw("components.langsSelected", "Selected: {list}", { list: list || "—" });
  });
  const pageSummary = van.derive(() =>
    raw("components.pageOf", "Page {n} of {total}", { n: demoPage.val, total: 12 }),
  );
  const countrySummary = van.derive(() => {
    const names: Record<string, string> = {
      ar: raw("components.countryAr", "Argentina"),
      bo: raw("components.countryBo", "Bolivia"),
      co: raw("components.countryCo", "Colombia"),
      mx: raw("components.countryMx", "Mexico"),
    };
    const name = names[demoCountry.val];
    return raw("components.countrySelected", "Selected country: {name}", { name: name ?? "—" });
  });
  const demoDrawerBottom = van.state(false);
  const demoPlan = van.state("pro");
  const planSummary = van.derive(() => {
    const names: Record<string, string> = {
      basic: raw("components.planBasic", "Basic"),
      pro: raw("components.planPro", "Pro"),
      business: raw("components.planBusiness", "Business"),
    };
    return raw("components.planSelected", "Selected plan: {name}", { name: names[demoPlan.val] ?? "—" });
  });

  const demoMessage = TextareaField({
    name: "demo-message",
    label: i18n.t("components.textareaLabel", "Message"),
    placeholder: i18n.t("components.textareaPlaceholder", "Tell us more about your project..."),
    rows: 3,
  });
  const demoAccept = Checkbox({
    name: "demo-form-terms",
    label: i18n.t("components.checkTerms", "I accept the terms and conditions"),
    required: true,
  });
  const demoForm = Form(() => {
    toast.success(raw("components.formSent", "Form submitted successfully!"));
  });
  demoForm.add(demoMessage, demoAccept);
  const formDemo = demoForm.dom(
    Button({ type: "submit" }, i18n.t("components.formSubmit", "Send")),
  );

  const columns: TableColumn<SampleUser>[] = [
    { key: "name", header: i18n.t("components.colUser", "User"), sortable: true },
    { key: "role", header: i18n.t("components.colRole", "Role"), sortable: true },
    {
      key: "status",
      header: i18n.t("components.colStatus", "Status"),
      sortable: true,
      render: (row) => {
        const variantMap: Record<SampleUser["status"], "success" | "warning" | "danger"> = {
          active: "success",
          pending: "warning",
          suspended: "danger",
        };
        const textMap = {
          active: i18n.t("components.statusActive", "Active"),
          pending: i18n.t("components.statusPending", "Pending"),
          suspended: i18n.t("components.statusSuspended", "Suspended"),
        };
        return Badge({
          variant: variantMap[row.status],
          text: textMap[row.status],
          dot: true,
          size: "sm",
        });
      },
    },
    { key: "created", header: i18n.t("components.colCreated", "Created"), sortable: true, align: "right" },
  ];

  return div(
    {
      id: "components-page",
      class: "space-y-12 py-4",
    },
    // Cabecera Principal
    div(
      { class: "border-b border-border pb-5" },
      h1({ class: "text-3xl font-extrabold text-foreground" }, i18n.t("components.title", "Component Showcase")),
      p({ class: "text-foreground-soft text-sm mt-1" }, i18n.t("components.subtitle", "Interactive components built with VanJS and VanUikit")),
    ),

    // 1. Theme & i18n Control Section (Componentes Embebidos de VanUikit)
    section(
      { class: "space-y-5 p-6 rounded-2xl border border-border bg-secondary/10 shadow-sm" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-lg font-bold text-foreground" }, i18n.t("components.themeSection", "Theme & Locale Management")),
        Badge({ text: i18n.t("components.embeddedBadge", "Embedded in VanUikit"), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.themeDesc", "Zero-overhead global state: instant switching and automatic synchronization.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-4 pt-2" },
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.themeToggleDemo", "ThemeToggle (Button & Segmented)")),
          div(
            { class: "flex flex-wrap items-center gap-3" },
            ThemeToggle({ theme, i18n, showLabel: true }),
            ThemeToggle({ theme, i18n, variant: "segmented" }),
          ),
        ),
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.localeSelectorDemo", "LocaleSelector (Select & Buttons)")),
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
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.formControls", "Form Controls")),
        Badge({ text: i18n.t("components.newBadge", "New"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.formControlsDesc", "Binary and multiline controls with reactive state, keyboard navigation and native Form integration.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        // Checkbox
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.checkboxCard", "Checkbox")),
          Checkbox({
            name: "demo-newsletter",
            label: i18n.t("components.checkNewsletter", "Subscribe to the newsletter"),
            description: i18n.t("components.checkNewsletterDesc", "You will receive at most one email per month"),
          }).dom(),
          Checkbox({
            name: "demo-terms",
            label: i18n.t("components.checkTerms", "I accept the terms and conditions"),
            checked: demoTerms,
            size: "lg",
          }).dom(),
          Checkbox({
            name: "demo-disabled",
            label: i18n.t("components.checkDisabled", "Disabled option"),
            disabled: true,
          }).dom(),
        ),
        // Switch
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.switchCard", "Switch")),
          Switch({ name: "demo-switch-sm", size: "sm", label: i18n.t("components.switchCompact", "Compact") }).dom(),
          Switch({ name: "demo-switch-md", size: "md", label: i18n.t("components.switchEmails", "Email notifications") }).dom(),
          Switch({ name: "demo-switch-lg", size: "lg", label: i18n.t("components.switchAuto", "Automatic updates") }).dom(),
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
              { value: "basic", label: i18n.t("components.planBasic", "Basic"), description: i18n.t("components.planBasicDesc", "For personal projects") },
              { value: "pro", label: i18n.t("components.planPro", "Pro") },
              { value: "business", label: i18n.t("components.planBusiness", "Business"), disabled: true },
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
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.feedbackSection", "States & Feedback")),
        Badge({ text: i18n.t("components.newBadge", "New"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.feedbackDesc", "Persistent notices, reactive progress bars, loading placeholders and empty states.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        // Alert
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.alertCard", "Alert")),
          Alert(
            { variant: "info", title: i18n.t("components.alertInfoTitle", "What's new") },
            i18n.t("components.alertInfoBody", "Roadmap phase 2 is now available."),
          ),
          Alert(
            { variant: "success", title: i18n.t("components.alertSuccessTitle", "Saved") },
            i18n.t("components.alertSuccessBody", "Your changes have been applied."),
          ),
          Alert({ variant: "warning" }, i18n.t("components.alertWarningBody", "Your session will expire in 5 minutes.")),
          Alert(
            {
              variant: "error",
              title: i18n.t("components.alertErrorTitle", "Connection error"),
              dismissible: true,
              onDismiss: () => toast.info(raw("components.alertDismissed", "Notice dismissed")),
            },
            i18n.t("components.alertErrorBody", "We couldn't sync; try again whenever you're ready."),
          ),
        ),
        // Progress
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-4" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.progressCard", "Progress")),
          Progress({ value: demoProgress, label: i18n.t("components.uploadLabel", "Uploading files...") }),
          Progress({ indeterminate: true, label: i18n.t("components.syncLabel", "Syncing changes") }),
          div(
            { class: "flex gap-2" },
            Button(
              { variant: "secondary", size: "sm", onclick: () => (demoProgress.val = Math.max(0, demoProgress.val - 10)) },
              i18n.t("components.less", "Less"),
            ),
            Button(
              { variant: "secondary", size: "sm", onclick: () => (demoProgress.val = Math.min(100, demoProgress.val + 10)) },
              i18n.t("components.more", "More"),
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
            title: i18n.t("components.emptyTitle", "No results"),
            description: i18n.t("components.emptyDesc", "Try different terms or create a new record."),
            action: Button(
              { variant: "secondary", size: "sm" },
              i18n.t("components.emptyAction", "Create record"),
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
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.overlaySection", "Fine Overlays")),
        Badge({ text: i18n.t("components.newBadge", "New"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.overlayDesc", "Accessible tooltips, floating panels and drawers with focus trap and scroll lock.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        // Tooltip
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.tooltipCard", "Tooltip")),
          div(
            { class: "flex flex-wrap gap-2" },
            Tooltip(
              { content: i18n.t("components.tipTop", "Appears on top") },
              Button({ variant: "secondary", size: "sm" }, i18n.t("components.tipTopBtn", "Top")),
            ),
            Tooltip(
              { content: i18n.t("components.tipBottom", "Appears below"), position: "bottom" },
              Button({ variant: "secondary", size: "sm" }, i18n.t("components.tipBottomBtn", "Bottom")),
            ),
            Tooltip(
              { content: i18n.t("components.tipRight", "Appears to the right"), position: "right" },
              Button({ variant: "secondary", size: "sm" }, i18n.t("components.tipRightBtn", "Right")),
            ),
          ),
          p({ class: "text-xs text-foreground-soft" }, i18n.t("components.tipFocusHint", "They also show when focused with Tab (keyboard accessible).")),
        ),
        // Popover
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.popoverCard", "Popover")),
          Popover({
            trigger: Button({ variant: "secondary", size: "sm" }, i18n.t("components.popoverTrigger", "Options")),
            ariaLabel: i18n.t("components.popoverCard", "Popover"),
            content: (close) =>
              div(
                { class: "space-y-3 text-sm" },
                p({ class: "text-foreground-soft" }, i18n.t("components.popoverBody", "A floating panel with arbitrary content. Closes with Esc or an outside click.")),
                div(
                  { class: "flex gap-2" },
                  Button(
                    { size: "sm", onclick: () => toast.success(raw("components.popoverApplied", "Applied!")) },
                    i18n.t("components.popoverApply", "Apply"),
                  ),
                  Button({ variant: "secondary", size: "sm", onclick: close }, i18n.t("components.popoverClose", "Close")),
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
              i18n.t("components.drawerSideBtn", "Side panel"),
            ),
            Button(
              { variant: "secondary", size: "sm", onclick: () => (demoDrawerBottom.val = true) },
              i18n.t("components.drawerBottomBtn", "Bottom panel"),
            ),
          ),
          p({ class: "text-xs text-foreground-soft" }, i18n.t("components.drawerHint", "Esc, the backdrop or the × button close it; focus returns to the opener.")),
        ),
      ),
      // Drawers (posicionamiento fijo; viven aquí pero cubren la pantalla)
      Drawer(
        { open: demoDrawerRight, side: "right", class: "w-96" },
        div(
          { class: "p-6 pt-12 space-y-3 text-sm" },
          h3({ class: "text-base font-bold text-foreground" }, i18n.t("components.drawerTitle", "Side panel")),
          p({ class: "text-foreground-soft" }, i18n.t("components.drawerBody", "The drawer locks page scroll, traps focus (Tab can't escape) and returns it to the element that opened it.")),
          Button(
            { onclick: () => (demoDrawerRight.val = false) },
            i18n.t("components.drawerOk", "Got it"),
          ),
        ),
      ),
      Drawer(
        { open: demoDrawerBottom, side: "bottom" },
        div(
          { class: "p-6 pt-12 space-y-3 text-sm" },
          h3({ class: "text-base font-bold text-foreground" }, i18n.t("components.drawerBottomTitle", "Bottom panel")),
          p({ class: "text-foreground-soft" }, i18n.t("components.drawerBody", "The drawer locks page scroll, traps focus (Tab can't escape) and returns it to the element that opened it.")),
          Button(
            { onclick: () => (demoDrawerBottom.val = false) },
            i18n.t("components.drawerOk", "Got it"),
          ),
        ),
      ),
    ),

    // 5. Escala y pulido (Avatar / Breadcrumbs / Card / Accordion / Combobox)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.polishSection", "Scale & Polish")),
        Badge({ text: i18n.t("components.newBadge", "New"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.polishDesc", "Avatar with initials fallback, breadcrumbs, cards, accordion and a keyboard-first combobox.")),
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
          p({ class: "text-xs text-foreground-soft" }, i18n.t("components.avatarHint", "The last one uses an image that fails: it rotates to initials only.")),
          Breadcrumbs({
            items: [
              { label: i18n.t("components.bcHome", "Home"), href: "/" },
              { label: i18n.t("components.bcComponents", "Components"), href: "/components" },
              { label: i18n.t("components.bcHere", "You are here") },
            ],
          }),
        ),
        // Card
        div(
          { class: "space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.cardCard", "Card")),
          Card(
            { class: "p-5 space-y-2", hoverable: true },
            CardTitle({}, i18n.t("components.cardTitle", "Composed card")),
            p({ class: "text-sm text-foreground-soft" }, i18n.t("components.cardBody", "Card ships without padding: the consumer decides (p-5 here). With hoverable it adds a shadow on hover.")),
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
                title: i18n.t("components.acc1Title", "What is VanUikit?"),
                content: () => van.tags.p(i18n.t("components.acc1Body", "A reactive component library for VanJS: zero boilerplate, inline i18n and batteries included.")),
              },
              {
                id: "how",
                title: i18n.t("components.acc2Title", "Is the content rebuilt?"),
                content: () => van.tags.p(i18n.t("components.acc2Body", "Yes: the content factory runs on every open, so bindings are always fresh.")),
              },
              {
                id: "kbd",
                title: i18n.t("components.acc3Title", "What about the keyboard?"),
                content: () => van.tags.p(i18n.t("components.acc3Body", "Each header is a button with aria-expanded and its panel is a labelled region.")),
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
              { value: "mx", label: i18n.t("components.countryMx", "Mexico") },
            ],
          }).dom(),
          p({ class: "text-xs text-foreground-soft" }, countrySummary),
          p({ class: "text-xs text-muted-foreground" }, i18n.t("components.comboboxHint", "Type to filter; ↑/↓ navigate, Enter selects, Esc closes.")),
        ),
        // fmt (formato locale-aware)
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.fmtCard", "fmt (locale-aware formatting)")),
          div(
            { class: "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm" },
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtDateLabel", "Date")),
            span({ class: "text-foreground font-medium" }, fmtDate),
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtTimeLabel", "Time")),
            span({ class: "text-foreground font-medium" }, fmtTime),
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtPriceLabel", "Price")),
            span({ class: "text-foreground font-medium" }, fmtPrice),
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtTaxLabel", "VAT")),
            span({ class: "text-foreground font-medium" }, fmtTax),
            span({ class: "text-foreground-soft" }, i18n.t("components.fmtUpdatedLabel", "Updated")),
            span({ class: "text-foreground font-medium" }, fmtUpdated),
          ),
          p({ class: "text-xs text-foreground-soft" }, i18n.t("components.fmtHint", "Switch the language above: the values reformat themselves.")),
        ),
        // Pagination & Kbd
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.paginationCard", "Pagination & Kbd")),
          Pagination({ page: demoPage, totalPages: 12 }),
          p({ class: "text-xs text-foreground-soft" }, pageSummary),
          div(
            { class: "flex items-center gap-2 text-sm text-foreground-soft" },
            span(i18n.t("components.kbdHint", "Shortcuts:")),
            Kbd({ size: "sm" }, "⌘"),
            Kbd({ size: "sm" }, "K"),
          ),
        ),
        // Combobox multiple
        div(
          { class: "p-4 rounded-xl bg-card border border-border/80 space-y-3" },
          h3({ class: "text-xs font-semibold text-muted-foreground uppercase tracking-wider" }, i18n.t("components.langsLabel", "Languages (multiple)")),
          Combobox({
            name: "demo-langs",
            multiple: true,
            value: demoLangs,
            options: [
              { value: "es", label: i18n.t("components.langEs", "Spanish") },
              { value: "en", label: i18n.t("components.langEn", "English") },
              { value: "fr", label: i18n.t("components.langFr", "French") },
              { value: "de", label: i18n.t("components.langDe", "German") },
            ],
          }).dom(),
          p({ class: "text-xs text-foreground-soft" }, langsSummary),
          p({ class: "text-xs text-muted-foreground" }, i18n.t("components.comboboxHint", "Type to filter; ↑/↓ navigate, Enter selects, Esc closes.")),
        ),
      ),
    ),

    // 6. Tabs (Pestañas accesibles y reactivas)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.tabs", "Tabs")),
        Badge({ text: i18n.t("components.accessibleBadge", "ARIA Accessible"), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.tabsDesc", "Organize dense content with keyboard arrow navigation, badges, and multiple variants.")),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm space-y-6" },
        // Variante Underline
        Tabs({
          id: "demo-tabs-underline",
          variant: "underline",
          items: [
            {
              id: "overview",
              label: i18n.t("components.tabOverview", "General Overview"),
              badge: i18n.t("components.tabOverviewBadge", "New"),
              content: () =>
                div(
                  { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                  h3({ class: "font-bold text-foreground text-base" }, i18n.t("components.perfTitle", "📊 Performance Dashboard")),
                  p({ class: "text-foreground-soft leading-relaxed" }, i18n.t("components.perfBody", "VanUikit renders reactive SPA views with an ultra-light bundle (~1.5kB of VanJS core), no VDOM.")),
                ),
            },
            {
              id: "activity",
              label: i18n.t("components.tabActivity", "Activity"),
              badge: 4,
              content: () =>
                div(
                  { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                  h3({ class: "font-bold text-foreground text-base" }, i18n.t("components.eventsTitle", "⚡ Event Log")),
                  p({ class: "text-foreground-soft" }, i18n.t("components.eventsBody", "4 operations completed successfully in the last 24 hours.")),
                ),
            },
            {
              id: "security",
              label: i18n.t("components.tabSecurity", "Security"),
              content: () =>
                div(
                  { class: "p-4 rounded-xl bg-secondary/10 text-sm text-foreground space-y-2" },
                  h3({ class: "font-bold text-foreground text-base" }, i18n.t("components.securityTitle", "🔒 Authentication & Encryption")),
                  p({ class: "text-foreground-soft" }, i18n.t("components.securityBody", "Sessions protected with synchronous and asynchronous guards in the SPA router.")),
                ),
            },
            {
              id: "disabled-tab",
              label: i18n.t("components.tabDisabled", "Disabled"),
              disabled: true,
              content: () => div(i18n.t("components.disabledContent", "Not accessible")),
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
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.dropdowns", "Accessible Select & Dropdowns")),
        Badge({ text: i18n.t("components.listboxBadge", "Listbox + Menu"), variant: "success", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.dropdownsDesc", "Custom selects with full keyboard navigation, integrated search, and contextual action menus.")),
      div(
        { class: "grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        // Select con búsqueda
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.searchSelect", "Select with Search")),
          SelectDropdown({
            id: "framework-select",
            searchable: true,
            searchPlaceholder: i18n.t("components.selectSearchPlaceholder", "Search framework..."),
            value: selectedFramework,
            options: [
              { value: "vanjs", label: "VanJS", description: i18n.t("components.frameworkVanjs", "Ultra lightweight (1.0kB)") },
              { value: "react", label: "React", description: i18n.t("components.frameworkReact", "Popular ecosystem") },
              { value: "vue", label: "Vue", description: i18n.t("components.frameworkVue", "Progressive framework") },
              { value: "svelte", label: "Svelte", description: i18n.t("components.frameworkSvelte", "Cybernetically enhanced") },
            ],
            onChange: (val) => toast.info(i18n.raw("components.selectedToast", "Selected: {val}", { val })),
          }),
          p(
            { class: "text-xs text-muted" },
            // raw() lee currentLocale.val dentro del binding: reacciona al idioma y al valor.
            () => i18n.raw("components.currentValue", "Current value: {val}", { val: selectedFramework.val }),
          ),
        ),

        // Select de Países
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.countrySelect", "Icon Select")),
          SelectDropdown({
            id: "country-select",
            value: selectedCountry,
            options: [
              { value: "es", label: i18n.t("components.countryEs", "Spain"), icon: span("🇪🇸") },
              { value: "us", label: i18n.t("components.countryUs", "United States"), icon: span("🇺🇸") },
              { value: "fr", label: i18n.t("components.countryFr", "France"), icon: span("🇫🇷") },
              { value: "mx", label: i18n.t("components.countryMx", "Mexico"), icon: span("🇲🇽") },
              { value: "ar", label: i18n.t("components.countryAr", "Argentina"), icon: span("🇦🇷") },
            ],
            onChange: (val) => toast.info(i18n.raw("components.countryToast", "Country selected: {val}", { val })),
          }),
        ),

        // DropdownMenu contextual
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.actionsMenu", "Action Menu")),
          div(
            { class: "pt-1" },
            DropdownMenu({
              trigger: (isOpen) =>
                Button(
                  { variant: "secondary" },
                  div({ class: "flex items-center gap-2" }, span(i18n.t("components.actionsLabel", "Actions")), span({ class: () => isOpen.val ? "rotate-180 transition-transform" : "transition-transform" }, "▾")),
                ),
              items: [
                { type: "header", label: i18n.raw("components.accountHeader", "Account options") },
                { label: i18n.t("components.viewProfile", "View Profile"), icon: span("👤"), onClick: () => toast.info(i18n.raw("components.profileToast", "Navigating to profile")) },
                { label: i18n.t("components.settings", "Settings"), icon: span("⚙️"), badge: "Pro", onClick: () => toast.info(i18n.raw("components.settingsToast", "Opening settings")) },
                { type: "divider" },
                { label: i18n.t("components.signOut", "Sign Out"), icon: span("🚪"), destructive: true, onClick: () => toast.warning(i18n.raw("components.signOutToast", "Session closed")) },
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
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.confirmDialogs", "Confirmation Dialogs (ConfirmDialog)")),
        Badge({ text: i18n.t("components.imperativeBadge", "Imperative & Declarative"), variant: "warning", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.confirmDesc", "Modal abstraction for critical confirmations with Promise support, loading states, and variants.")),
      div(
        { class: "flex flex-wrap items-center gap-4 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "destructive",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: i18n.raw("components.deleteTitle", "Delete account permanently?"),
                message: i18n.raw("components.deleteMsg", "This action will delete all your data and associated transactions with no possibility of recovery."),
                variant: "danger",
                confirmText: i18n.raw("components.deleteConfirm", "Yes, delete account"),
                cancelText: i18n.raw("components.cancel", "Cancel"),
              });

              if (confirmed) {
                toast.error(i18n.raw("components.deletedToast", "Account successfully deleted"));
              } else {
                toast.info(i18n.raw("components.cancelledToast", "Action cancelled by the user"));
              }
            },
          },
          i18n.t("components.dangerBtn", "🗑️ Danger Dialog (Imperative)"),
        ),
        Button(
          {
            variant: "secondary",
            onclick: async () => {
              const confirmed = await confirmDialog({
                title: i18n.raw("components.publishTitle", "Publish changes?"),
                message: i18n.raw("components.publishMsg", "The changes will be applied immediately to all users in production."),
                variant: "primary",
                confirmText: i18n.raw("components.publishConfirm", "Publish now"),
              });

              if (confirmed) {
                toast.success(i18n.raw("components.publishedToast", "Changes published to production"));
              }
            },
          },
          i18n.t("components.infoBtn", "🚀 Info Dialog"),
        ),
      ),
    ),

    // 9. DataGrid / Table con búsqueda, ordenamiento y selección
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.tables", "Tables & DataGrid")),
        Badge({ text: i18n.t("components.searchSortBadge", "Search + Sort + Pagination"), variant: "primary", size: "sm" }),
      ),
      p({ class: "text-sm text-foreground-soft" }, i18n.t("components.tablesDesc", "Reactive data table with bidirectional column sorting, instant search, multi-selection, and pagination.")),
      DataGrid({
        columns,
        data: sampleUsers,
        pageSize: 4,
        searchable: true,
        searchPlaceholder: i18n.t("components.tableSearchPlaceholder", "Search by name or role..."),
        selectable: true,
        selectedRows: selectedUsers,
        onSelectionChange: (selected) => {
          if (selected.length > 0) {
            toast.info(i18n.raw("components.usersSelected", "{n} users selected", { n: selected.length }), { durationMs: 1500 });
          }
        },
      }),
    ),

    // 10. Badges & Toasts
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.badges", "Badges")),
      div(
        { class: "flex flex-wrap items-center gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Badge({ text: i18n.t("components.badgePrimary", "Primary"), variant: "primary" }),
        Badge({ text: i18n.t("components.badgeSuccess", "Success"), variant: "success", dot: true }),
        Badge({ text: i18n.t("components.badgeWarning", "Warning"), variant: "warning", dot: true }),
        Badge({ text: i18n.t("components.badgeDanger", "Danger"), variant: "danger", dot: true }),
        Badge({ text: i18n.t("components.badgeSecondary", "Secondary"), variant: "secondary" }),
        Badge({ text: i18n.t("components.badgeOutline", "Outline"), variant: "outline" }),
        Badge({ text: i18n.t("components.badgeLarge", "Large"), variant: "primary", size: "lg" }),
      ),
    ),

    // 11. Notificaciones Toast
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.toasts", "Notifications (Toast)")),
      div(
        { class: "flex flex-wrap gap-3 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        Button(
          {
            variant: "primary",
            onclick: () => toast.success(i18n.raw("components.toastSuccessMsg", "Operation completed successfully"), { title: i18n.raw("components.toastSuccessTitle", "Done") }),
          },
          i18n.t("components.toastSuccessBtn", "Success"),
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => toast.info(i18n.raw("components.toastInfoMsg", "A new update is available"), { title: i18n.raw("components.toastInfoTitle", "What's new") }),
          },
          i18n.t("components.toastInfoBtn", "Info"),
        ),
        Button(
          {
            variant: "secondary",
            onclick: () => toast.warning(i18n.raw("components.toastWarningMsg", "Session will expire in 5 minutes"), { title: i18n.raw("components.toastWarningTitle", "Notice") }),
          },
          i18n.t("components.toastWarningBtn", "Warning"),
        ),
        Button(
          {
            variant: "destructive",
            onclick: () => toast.error(i18n.raw("components.toastErrorMsg", "Could not connect to the server"), { title: i18n.raw("components.toastErrorTitle", "Failure") }),
          },
          i18n.t("components.toastErrorBtn", "Error"),
        ),
      ),
    ),

    // 12. Modal Clásico & Spinner
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.modals", "Modals")),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm space-y-5" },
        div(
          { class: "flex flex-wrap items-center gap-4" },
          Button(
            {
              variant: "secondary",
              onclick: () => {
                modal.set({
                  header: () => div({ class: "text-lg font-bold" }, i18n.raw("components.modalTitle", "Basic VanUikit Modal")),
                  body: () => div({ class: "py-2 text-sm text-foreground-soft leading-relaxed" }, i18n.raw("components.modalBody", "This modal is fully reactive and mounts/unmounts with native VanJS states.")),
                  footer: () =>
                    div(
                      { class: "flex justify-end gap-2" },
                      Button(
                        {
                          variant: "secondary",
                          onclick: () => modal.close(),
                        },
                        i18n.raw("components.modalClose", "Close"),
                      ),
                      Button(
                        {
                          variant: "primary",
                          onclick: () => {
                            modal.close();
                            toast.success(i18n.raw("components.modalConfirmedToast", "Action confirmed from the modal"));
                          },
                        },
                        i18n.raw("components.modalAccept", "Accept"),
                      ),
                    ),
                });
                modal.open();
              },
            },
            i18n.t("components.openModalBtn", "Open Basic Modal"),
          ),
        ),
        // Spin en su propia franja centrada: junto al botón se veía descolgado.
        div(
          { class: "flex justify-center rounded-xl border border-border/60 bg-secondary/10" },
          Spin(i18n.t("components.spinMsg", "Loading indicator...")),
        ),
      ),
      modal.dom(),
    ),

    // 13. Dashboard Layout & Sidebars (VanUikit AppShell)
    section(
      { class: "space-y-4" },
      h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.layoutsSection", "Layouts & Dashboard Shell")),
      p(
        { class: "text-sm text-foreground-soft" },
        i18n.t("components.layoutsDesc", "Mobile-first adaptive structure with a sliding drawer on touch screens and a static sidebar on desktop."),
      ),
      div(
        { class: "p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4" },
        div(
          { class: "grid grid-cols-1 sm:grid-cols-3 gap-4" },
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "📱"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t("components.mobileDrawerTitle", "Mobile-First Drawer")),
            p({ class: "text-xs text-muted-foreground" }, i18n.t("components.mobileDrawerDesc", "Darkened blurred backdrop, automatic close on link selection, and an accessible hamburger button.")),
          ),
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "🖥️"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t("components.desktopSidebarTitle", "Desktop Sidebar")),
            p({ class: "text-xs text-muted-foreground" }, i18n.t("components.desktopSidebarDesc", "Persistent side panel with navigation groups, icons, reactive badges, and a user footer.")),
          ),
          div(
            { class: "p-4 rounded-xl bg-background border border-border/80 space-y-2" },
            span({ class: "text-xl" }, "🧭"),
            h3({ class: "font-semibold text-sm text-foreground" }, i18n.t("components.headerSyncTitle", "HeaderBar & Router Sync")),
            p({ class: "text-xs text-muted-foreground" }, i18n.t("components.headerSyncDesc", "Automatic title and active link (aria-current) synchronization with the app's singleton router.")),
          ),
        ),
      ),
    ),

    // 14. DatePicker (inspirado en jQuery UI DatePicker)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.datepickerSection", "DatePicker")),
        Badge({ text: i18n.t("components.newBadge", "New"), variant: "success", size: "sm" }),
      ),
      p(
        { class: "text-sm text-foreground-soft" },
        i18n.t("components.datepickerDesc", "Date selection calendar inspired by jQuery UI: month navigation, day grid, popup and inline, with Intl-based locale and the Field contract."),
      ),
      div(
        { class: "grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-border bg-background shadow-sm" },
        // Popup (input read-only + calendario)
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.datepickerPopup", "Popup (input)")),
          DatePicker({
            name: "due-date",
            label: i18n.t("components.datepickerDueLabel", "Due date"),
            value: demoDate,
            required: true,
          }).dom(),
        ),
        // Inline con min/max y valor compartido
        div(
          { class: "space-y-2" },
          span({ class: "text-xs font-semibold text-foreground-soft uppercase tracking-wider" }, i18n.t("components.datepickerInline", "Inline with min/max")),
          DatePicker({
            inline: true,
            value: demoDate,
            min: new Date(2026, 0, 1),
            max: new Date(2026, 11, 31),
          }).dom(),
          p(
            { class: "text-xs text-muted" },
            // raw() lee currentLocale.val dentro del binding: reacciona al idioma y al valor.
            () => i18n.raw("components.datepickerSelected", "Selected: {val}", { val: fmt.raw.date(demoDate.val ?? new Date()) }),
          ),
        ),
      ),
    ),

    // 15. Wizard (formulario multi-paso)
    section(
      { class: "space-y-4" },
      div(
        { class: "flex items-center justify-between" },
        h2({ class: "text-xl font-bold text-foreground" }, i18n.t("components.wizardSection", "Wizard (Multi-Step Form)")),
        Badge({ text: i18n.t("components.newBadge", "New"), variant: "success", size: "sm" }),
      ),
      p(
        { class: "text-sm text-foreground-soft" },
        i18n.t("components.wizardDesc", "Large forms split across screens: shared store, per-step validation and the same FormResult contract with the backend."),
      ),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm" },
        WizardDemo(),
      ),
      div(
        { class: "p-6 rounded-2xl border border-border bg-background shadow-sm" },
        WizardProgrammaticDemo(),
      ),
    ),
  );
}
