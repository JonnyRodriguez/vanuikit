# Form controls

VanUikit's form controls are reactive, accessible building blocks built on a single VanJS instance. Every component accepts a plain value *or* a `van.State` for any visual/control prop (e.g. `checked`, `disabled`, `value`), which enables two-way binding. All of the components below are re-exported from the `vanuikit` package; `van` must be imported from `"vanuikit"` — never from `vanjs-core` — to avoid the two-copies reactivity failure.

The text controls (`Field` and its convenience wrappers) implement a shared `Field` contract (reactive `value`/`error`/`isTouched`/`isValid`/`isInvalid`/`stateClass`, plus `validate`, `setError`, `clearError`, `addValidator` and `dom`). The selection controls (`Checkbox`, `Switch`, `RadioGroup`) implement the same contract through a shared `ControlField` base, so all of them can be registered with `Form`.

---

## `Button`

Unified, accessible button. Variants and sizes map to theme semantic tokens; `type` defaults to `"button"` to avoid accidental submits, so pass `type: "submit"` explicitly when the button lives inside a `Form`.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `variant` | `ButtonVariant` — `"primary" \| "secondary" \| "destructive"` | `"primary"` | Color variant. |
| `size` | `ButtonSize` — `"sm" \| "md" \| "lg"` | `"md"` | Size variant. |
| `block` | `boolean` | `false` | Full width (`w-full`); useful inside forms. Auto width otherwise. |
| `class` | `string` | `—` | Extra CSS classes appended to the base classes. |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Native button type. |
| `[key: string]` | `any` | `—` | Any additional native attribute or handler is spread onto the `<button>` (e.g. `onclick`, `disabled`, `aria-*`). |

### Usage

```ts
import { Button, PrimaryButton, SecondaryButton } from "vanuikit";

Button({ variant: "primary", size: "md", onclick: () => save() }, "Save");
Button({ type: "submit", block: true }, "Log in");
PrimaryButton({}, "Primary");
SecondaryButton({}, "Secondary");
```

### Notes

- `variant` and `size` are optional; the defaults are `primary` and `md`.
- Because `type` defaults to `"button"`, remember to set `type: "submit"` when you want a button to submit a `Form`.
- `PrimaryButton` / `SecondaryButton` are thin compatibility wrappers that fix `variant` to `primary` / `secondary` (all other props pass through).
- Reactivity: `class` and other props may be given as reactive `State` values via the spread passthrough.

---

## `PrimaryButton`

Compatibility wrapper around `Button` that forces `variant: "primary"`. Accepts the same props as `Button` minus `variant`.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `size` | `ButtonSize` | `"md"` | Size variant. |
| `block` | `boolean` | `false` | Full width (`w-full`). |
| `class` | `string` | `—` | Extra CSS classes. |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Native button type. |
| `[key: string]` | `any` | `—` | Additional native attributes/handlers. |

### Usage

```ts
import { PrimaryButton } from "vanuikit";

PrimaryButton({ type: "submit" }, "Continue");
```

### Notes

- Identical behavior to `Button({ variant: "primary", ... })`.

---

## `SecondaryButton`

Compatibility wrapper around `Button` that forces `variant: "secondary"`. Accepts the same props as `Button` minus `variant`.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `size` | `ButtonSize` | `"md"` | Size variant. |
| `block` | `boolean` | `false` | Full width (`w-full`). |
| `class` | `string` | `—` | Extra CSS classes. |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Native button type. |
| `[key: string]` | `any` | `—` | Additional native attributes/handlers. |

### Usage

```ts
import { SecondaryButton } from "vanuikit";

SecondaryButton({ onclick: () => cancel() }, "Cancel");
```

### Notes

- Identical behavior to `Button({ variant: "secondary", ... })`.

---

## `Field`

The low-level text-control factory. It returns a `Field` object (the shared contract used by `Field`'s higher-level wrappers and by the selection controls). You will normally use `TextField`, `EmailField`, `PasswordField` or `TextareaField`, but `Field` is exported for custom inputs.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `label` | `FieldText` (`string \| State<string>`) | `—` (required) | Label text shown above the control. |
| `name` | `string` | `—` (required) | Control name; used as `id`, `name` attribute, and the key in form data. |
| `inputType` | `string` | `—` | Native input type (e.g. `"text"`, `"email"`, `"password"`). |
| `placeholder` | `FieldText` | `—` | Placeholder text. |
| `hint` | `FieldText` | `—` | Helper text rendered below the field. |
| `disabled` | `boolean \| State<boolean>` | `false` | Disables the control. |
| `multiline` | `boolean` | `—` | When true, renders a `<textarea>` instead of an `<input>`. |
| `rows` | `number` | `—` | Number of rows when `multiline` is true. |

### Returned `Field` object

| Member | Type | Description |
|---|---|---|
| `name` | `string` | The control name. |
| `value` | `State<string>` | Reactive current value. |
| `error` | `State<string>` | Reactive validation message (empty when valid). |
| `isTouched` | `State<boolean>` | True once the field has been blurred. |
| `isValid` | `State<boolean>` | True when there is no error and the value is non-empty. |
| `isInvalid` | `State<boolean>` | True when touched and an error is present. |
| `stateClass` | `State<string>` | `"field-pristine"` / `"field-valid"` / `"field-invalid"`. |
| `addValidator(validator)` | `Field` | Appends a `Validator`; chainable (returns the field). |
| `validate(valueOrData?, data?)` | `boolean` | Runs the validators; returns true if valid. |
| `dom()` | `HTMLElement` | Returns the rendered field DOM. |
| `setError(msg)` | `void` | Sets an error and marks the field touched. |
| `clearError()` | `void` | Clears the error. |

### Usage

```ts
import { Field, Required } from "vanuikit";

const nameField = Field(
  { label: "Full name", name: "name", inputType: "text" },
  [Required("Please enter your name")],
);
```

### Notes

- Validation runs on `blur`, and on `input` once the field has been touched.
- `label`, `placeholder`, `hint` accept either a plain string or a reactive `State<string>` (from `t()`), so they re-render on locale changes.
- When `multiline` is true, `rows` defaults to `4`.

---

## `TextField`

Required free-text field. Batteries included with the global i18n singleton. Two overloads: an options object, or the legacy positional form `(label, name, placeholder)`.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `label` | `FieldText` | `t("field.name.label", "Full name")` | Label text. |
| `name` | `string` | `"name"` | Field name. |
| `placeholder` | `FieldText` | `t("field.name.placeholder", "John Doe")` | Placeholder text. |
| `hint` | `FieldText` | `—` | Helper text. |
| `required` | `boolean` | `true` | Whether a `Required` validator is added. |
| `requiredMsg` | `FieldText` | `t("field.name.required", "Please enter your name")` | Message used by the `Required` validator. |

### Usage

```ts
import { TextField } from "vanuikit";

const name = TextField(); // defaults: label "Full name", name "name"
const custom = TextField({ name: "first", label: "First name", required: false });
// legacy positional form:
const legacy = TextField("Name", "name", "Your name");
```

### Notes

- In the positional overload, `name` defaults to `"text"`.
- When `required` is true (the default), a `Required` validator with `requiredMsg` is appended.

---

## `EmailField`

Email field: always required + format validated. Batteries included with the global i18n singleton. Two overloads: options object or positional `(label, name, placeholder)`.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `label` | `FieldText` | `t("field.email.label", "Email")` | Label text. |
| `name` | `string` | `"email"` | Field name. |
| `placeholder` | `FieldText` | `t("field.email.placeholder", "you@example.com")` | Placeholder text. |
| `hint` | `FieldText` | `—` | Helper text. |
| `requiredMsg` | `FieldText` | `t("field.email.required", "Please enter your email")` | Message used by the `Required` validator. |
| `invalidMsg` | `FieldText` | `t("field.email.invalid", "Invalid email address")` | Message used by the `Email` validator. |

### Usage

```ts
import { EmailField } from "vanuikit";

const email = EmailField(); // required + format validation
```

### Notes

- Always adds `Required` and `Email` validators, regardless of options.
- In the positional overload, `placeholder` defaults to `"you@example.com"`.

---

## `PasswordField`

Password field: required + minimum length. Batteries included with the global i18n singleton. Two overloads: options object or positional `(label, name, placeholder, min)`.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `label` | `FieldText` | `t("field.password.label", "Password")` | Label text. |
| `name` | `string` | `"password"` | Field name. |
| `placeholder` | `FieldText` | `t("field.password.placeholder", "••••••••")` | Placeholder text. |
| `hint` | `FieldText` | `—` | Helper text. |
| `min` | `number` | `6` | Minimum password length. |
| `requiredMsg` | `FieldText` | `t("field.password.required", "Please enter your password")` | Message used by the `Required` validator. |
| `minMsg` | `FieldText` | `t("field.password.min", "Password must be at least {min} characters", { min })` | Message used by the `MinLength` validator. |

### Usage

```ts
import { PasswordField } from "vanuikit";

const password = PasswordField(); // min length 6
const strict = PasswordField({ min: 10 });
```

### Notes

- Always adds `Required` and `MinLength(min)` validators; `min` defaults to `6`.

---

## `TextareaField`

Multiline text field. Batteries included with the global i18n singleton.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `label` | `FieldText` | `t("field.message.label", "Message")` | Label text. |
| `name` | `string` | `"message"` | Field name. |
| `placeholder` | `FieldText` | `t("field.message.placeholder", "Write here...")` | Placeholder text. |
| `hint` | `FieldText` | `—` | Helper text. |
| `required` | `boolean` | `true` | Whether a `Required` validator is added. |
| `requiredMsg` | `FieldText` | `t("field.message.required", "Please enter your message")` | Message used by the `Required` validator. |
| `rows` | `number` | `4` | Number of `<textarea>` rows. |

### Usage

```ts
import { TextareaField } from "vanuikit";

const message = TextareaField({ name: "message", rows: 6 });
```

### Notes

- Always renders a `<textarea>` (`multiline: true`).
- When `required` is true (the default), a `Required` validator with `requiredMsg` is appended.

---

## `Checkbox`

Accessible checkbox: a native (screen-reader-visible) input with a styled box. Space toggles it, and clicking the label/description does too. `checked` accepts an external `State<boolean>` for two-way binding.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `"checkbox"` | Field name. |
| `label` | `ToggleText` (`string \| State<string>`) | `—` | Label text. |
| `description` | `ToggleText` | `—` | Supporting description text (wired via `aria-describedby`). |
| `checked` | `boolean \| State<boolean>` | `false` | Checked state; accepts an external `State` for two-way binding. |
| `indeterminate` | `boolean \| State<boolean>` | `false` | When true, renders a dash instead of a check. |
| `disabled` | `boolean \| State<boolean>` | `false` | Disables the control. |
| `size` | `CheckSize` — `"sm" \| "md" \| "lg"` | `"md"` | Size variant. |
| `required` | `boolean` | `false` | When true, shows an error on submit while unchecked (integrates with `Form`). |
| `requiredMsg` | `ToggleText` | `t("checkbox.required", "You must check this option")` | Message used when required and unchecked. |
| `class` | `string` | `—` | Extra CSS classes on the field wrapper. |
| `[key: string]` | `any` | `—` | Additional attributes/handlers spread onto the native input. |

### Usage

```ts
import { Checkbox, Form } from "vanuikit";

const accept = Checkbox({ name: "accept", label: "I agree", required: true });
const form = Form({ onSubmit: () => ({ ok: true }) }).add(accept);
```

### Notes

- Returns a `CheckboxField`: the `ControlField` contract plus `checked: State<boolean>` and `dom(): HTMLElement`. `value` derives to `"on"` when checked, `""` otherwise.
- Reactivity: `checked`, `indeterminate`, `disabled` and `label`/`description` accept `van.State`.
- Accessibility: space toggles, `aria-invalid` reflects validation state, `aria-describedby` links `description`.

---

## `Switch`

Accessible switch: a native input with `role="switch"` and a styled track/thumb. Space toggles it and screen readers announce it as a switch. `checked` accepts an external `State<boolean>` for two-way binding.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | `"switch"` | Field name. |
| `label` | `ToggleText` | `—` | Label text. |
| `description` | `ToggleText` | `—` | Supporting description text (wired via `aria-describedby`). |
| `checked` | `boolean \| State<boolean>` | `false` | Toggle state; accepts an external `State` for two-way binding. |
| `disabled` | `boolean \| State<boolean>` | `false` | Disables the control. |
| `size` | `CheckSize` | `"md"` | Size variant. |
| `required` | `boolean` | `false` | When true, shows an error on submit while off (integrates with `Form`). |
| `requiredMsg` | `ToggleText` | `t("switch.required", "You must turn this option on")` | Message used when required and off. |
| `class` | `string` | `—` | Extra CSS classes on the field wrapper. |
| `[key: string]` | `any` | `—` | Additional attributes/handlers spread onto the native input. |

### Usage

```ts
import { Switch } from "vanuikit";

const theme = Switch({ name: "dark", label: "Dark mode", checked: darkMode });
```

### Notes

- Returns a `SwitchField`: the `ControlField` contract plus `checked: State<boolean>` and `dom(): HTMLElement`. `value` derives to `"on"` when on, `""` otherwise.
- Reactivity: `checked`, `disabled` and `label`/`description` accept `van.State`.
- Accessibility: `role="switch"`, space toggles, `aria-invalid` reflects validation state.

---

## `RadioGroup`

Accessible, mutually exclusive radio group (`role="radiogroup"`). Arrow keys ↑/↓/←/→ move selection between enabled options (roving focus); Tab enters and leaves the group. `value` accepts an external `State<string>` for two-way binding.

### Props / Options

| Name | Type | Default | Description |
|---|---|---|---|
| `options` | `RadioOption[]` | `—` (required) | The selectable options. |
| `name` | `string` | `"radio"` | Field name (each native input uses `` `${name}-${option.value}` `` as its `id`). |
| `value` | `string \| State<string>` | `""` | Selected value; accepts an external `State` for two-way binding. |
| `size` | `CheckSize` | `"md"` | Size variant. |
| `ariaLabel` | `ToggleText` | `—` | Accessible label of the group (`aria-label` of the container). |
| `disabled` | `boolean \| State<boolean>` | `false` | Disables the entire group. |
| `required` | `boolean` | `false` | When true, shows an error on submit with no selection (integrates with `Form`). |
| `requiredMsg` | `ToggleText` | `t("radio.required", "Please select an option")` | Message used when required and nothing is selected. |
| `class` | `string` | `—` | Extra CSS classes on the field wrapper. |
| `[key: string]` | `any` | `—` | Additional attributes/handlers spread onto the container. |

Each `RadioOption` has:

| Name | Type | Description |
|---|---|---|
| `value` | `string` | The submitted value of the option. |
| `label` | `ToggleText` | Option label. |
| `description` | `ToggleText` | Optional option description. |
| `disabled` | `boolean \| State<boolean>` | Disables just this option. |

### Usage

```ts
import { RadioGroup, Form } from "vanuikit";

const plan = RadioGroup({
  name: "plan",
  ariaLabel: "Plan",
  options: [
    { value: "basic", label: "Basic" },
    { value: "pro", label: "Pro" },
  ],
  required: true,
});
const form = Form({ onSubmit: () => ({ ok: true }) }).add(plan);
```

### Notes

- Returns a `RadioGroupField`: the `ControlField` contract (with `value: State<string>` holding the selected value) plus `dom(): HTMLElement`.
- Reactivity: `value`, `disabled`, `ariaLabel` and per-option `label`/`description`/`disabled` accept `van.State`.
- Accessibility: `role="radiogroup"`, roving focus with arrow keys, `aria-invalid` reflects validation state. The group's `aria-label` is only set when `ariaLabel` is provided.

---

## `Form`

Factory for a form with a unified v3 contract: validate on the client (schema or field validators), paint errors per field (via `setError`) or as a general line, protect against double submit, and await `onSubmit` — applying the backend response with the same contract on both ends. **This is a function-style API.**

### Signature

```ts
Form(config: FormConfig): Form
```

`FormConfig = FormOptions | FormLegacyHandler`.

`FormOptions`:

| Name | Type | Description |
|---|---|---|
| `schema` | `SchemaLike` | Shared schema (zod or compatible, structural shape with `safeParse`). Optional — without it, field validators are used. |
| `onSubmit` | `(data: Record<string, unknown>) => Promise<FormResult> \| FormResult` | Sends data to the backend; must return the `FormResult` contract. |
| `onBeforeValidate` | `(data) => void` | Hook before validating. |
| `onBeforeSubmit` | `(data) => void` | Hook after validation passes, before submitting. |
| `onSuccess` | `(data, result: { ok: true }) => void` | Hook on success. Default: clears errors. |
| `onError` | `(result: { ok: false; error?; fieldErrors? }) => void` | Hook on error. Default: paints general line / field errors. |

`FormResult = { ok: true } | { ok: false; error?: string; fieldErrors?: Record<string, string> }`.

A `FormLegacyHandler` (`(data) => void | { ok? } | { error? }`) is normalized to the `FormResult` contract.

Returned `Form` object:

| Member | Type | Description |
|---|---|---|
| `add(...fields)` | `Form` | Registers `Field`/`ControlField` objects; chainable. |
| `dom(...footer)` | `ChildDom` | The `<form>` with fields and an optional footer; validates on every submit. |
| `submitting` | `State<boolean>` | True while `onSubmit` runs (use to disable the button). |
| `error` | `State<string>` | General error line (client or backend). |
| `fieldErrors` | `State<Record<string, string>>` | Per-field backend errors. |
| `clear()` | `void` | Clears the general line, `fieldErrors` and field errors. |

### Usage

```ts
import { Form, TextField, EmailField, Button } from "vanuikit";

const form = Form({
  onSubmit: async (data) => {
    try { await api.login(data); return { ok: true }; }
    catch (e) { return { ok: false, error: e.message }; }
  },
});

const email = EmailField();
const password = PasswordField();
form.add(email, password);

container.appendChild(
  form.dom(
    Button({ type: "submit", block: true, disabled: form.submitting }, "Sign In"),
  ),
);
```

### Notes

- **Double validation**: the client validates for UX; the server *always* re-validates with the same schema (security). The schema lives in `shared/` and is imported on both sides.
- When `schema` is provided it is the primary validation source (field validators are bypassed); otherwise each registered field's validators run.
- Backend `fieldErrors` are applied via `setError` per field; messages that map to no registered field go to the general `error` line.
- Buttons inside `dom()` should be `type: "submit"`; the form blocks a second submit while `submitting` is true.
- `onSubmit` returning `{ ok: false, fieldErrors }` lets the backend paint per-field errors.

---

## `Wizard`

Factory for large forms split across screens (e.g. a marketplace-style listing). Reuses the `Form` v3 contract with a shared structured store (steps unmount but their values persist), per-step validation when advancing, and a final submit with the same `FormResult` contract. **This is a function-style API.**

### Signature

```ts
Wizard(options: WizardOptions): WizardHandle
```

`WizardOptions`:

| Name | Type | Description |
|---|---|---|
| `steps` | `WizardStep[]` | The ordered steps. |
| `onSubmit` | `(data: Record<string, unknown>) => Promise<FormResult> \| FormResult` | Sends the accumulated data of all steps (FormResult contract). |
| `onStepChange` | `(index: number) => void` | Called when the current step changes. |
| `onSuccess` | `(data, result: { ok: true }) => void` | Hook on success. |
| `onError` | `(result: { ok: false; error?; fieldErrors? }) => void` | Hook on error. |

`WizardStep`:

| Name | Type | Description |
|---|---|---|
| `title` | `string \| State<string>` | Step title (shown in the indicator and header). |
| `schema` | `SchemaLike` | Zod-like schema of this step — primary validation source when advancing. |
| `fields` | `WizardField[]` | Rendered fields; they feed the store and serve as validation fallback when no schema is given. |
| `content` | `ChildDom[]` | Extra nodes rendered below the fields. |
| `collect` | `() => Record<string, unknown>` | Collects the step's structured values. Default: from `fields`. |

`WizardHandle`:

| Member | Type | Description |
|---|---|---|
| `dom()` | `HTMLElement` | Renders the wizard. |
| `step` | `State<number>` | Index of the current step (0-based). |
| `store` | `State<Record<string, unknown>>` | Structured store holding the accumulated values. |
| `submitting` | `State<boolean>` | True while `onSubmit` runs (disables, blocks double submit). |
| `error` | `State<string>` | General error line (client or backend). |
| `next()` | `boolean` | Validates the current step and advances; returns true if it advanced. |
| `back()` | `void` | Goes back one step without validating. |
| `goTo(index)` | `void` | Jumps to a step (seeding the store). Does not validate intermediate steps. |
| `collectStep(index?)` | `Record<string, unknown>` | Collects a step's data (default: current) merged with the store. |
| `validateCurrent()` | `boolean` | Validates the current step without advancing; true if valid. |

### Usage

```ts
import { Wizard, TextField, EmailField } from "vanuikit";

const wizard = Wizard({
  steps: [
    { title: "Account", fields: [EmailField(), PasswordField()] },
    { title: "Profile", fields: [TextField({ name: "displayName" })] },
  ],
  onSubmit: async (data) => ({ ok: true }),
});

container.appendChild(wizard.dom());
```

### Notes

- **Per-step validation**: advancing runs the step's `schema` (primary) or its field validators. The step's data is committed to the shared `store`.
- Backend `fieldErrors` are routed to the step containing each field; errors pointing at another step land in the general line with a "check step N" hint (`raw("wizard.checkSteps", ...)`).
- i18n: the Back/Next/Submit buttons use `t()` (`wizard.back` / `wizard.next` / `wizard.submit`); the step indicator line uses `raw("wizard.step", ...)` at a top-level derive (per the container rule, no `raw()`/`t()` reads inside the binding as a child).

---

## `LoginForm`

Prebuilt reference login screen (`Form` + `EmailField` + `PasswordField` + `Button` + `Spin`). The fields resolve their labels, placeholders and validations automatically from the global i18n. Uses the `Form` v3 contract: `submitting`, a general error line, and no double submit. **Function-style API.**

### Signature

```ts
LoginForm(info: LoginInfo): ChildDom
```

`LoginInfo`:

| Name | Type | Description |
|---|---|---|
| `handleLogin` | `(data: Record<string, unknown>) => Promise<AuthResult>` | Your login handler. |

`AuthResult = { error: string } | { ok?: boolean } | {}` — returning `{ error }` surfaces the message in the general error line; anything else is treated as success.

### Usage

```ts
import { LoginForm } from "vanuikit";

container.appendChild(
  LoginForm({
    handleLogin: async (data) => {
      try { await api.login(data); return { ok: true }; }
      catch (e) { return { error: e.message }; }
    },
  }),
);
```

### Notes

- Renders an email + password field and a "Sign In" button (`type: "submit"`).
- While `handleLogin` is pending, a `Spin` indicator replaces the button (`t("login.loading", ...)`); the button is disabled during submit.
- The submit button label is `t("login.submit", "Sign In")`.
- i18n: customize text by passing field options, or edit the global i18n singleton's `es`/`fr` dictionaries (`en` is generated from the defaults).

---

## `RegisterForm`

Prebuilt reference registration screen (`Form` + `TextField` + `EmailField` + `PasswordField` + `Button` + `Spin`). Fields ship default labels, placeholders and validations from the global i18n. Uses the `Form` v3 contract. **Function-style API.**

### Signature

```ts
RegisterForm(info: RegisterInfo): ChildDom
```

`RegisterInfo`:

| Name | Type | Description |
|---|---|---|
| `handleRegister` | `(data: Record<string, unknown>) => Promise<AuthResult>` | Your registration handler. |

`AuthResult = { error: string } | { ok?: boolean } | {}`.

### Usage

```ts
import { RegisterForm } from "vanuikit";

container.appendChild(
  RegisterForm({
    handleRegister: async (data) => {
      try { await api.register(data); return { ok: true }; }
      catch (e) { return { error: e.message }; }
    },
  }),
);
```

### Notes

- Renders four fields: `name` (a `TextField` with `name: "name"`), `email`, `password`, and `confirm` (a `PasswordField` with a `Match("password", ...)` validator so the two passwords must match).
- The submit button label is `t("register.submit", "Create Account")`; while `handleRegister` is pending a `Spin` indicator replaces it (`t("register.loading", ...)`) and the button is disabled.
- i18n keys used by the confirm field: `field.confirm.label`, `field.confirm.placeholder`, `field.confirm.required`, `field.confirm.mismatch`.
