# MIGRATION.md — de `old/base.js` a `lib/src/`

Documento de trazabilidad de la migración del monolito original a la librería
modular en TypeScript. El original **no se modificó**: `old/base.js` y
`old/recargar` (página HTML) quedan como referencia versionada.

## Estructura

```
old/base.js          ← fuente original (monolito, VanJS + QRCodeStyling)
lib/src/index.ts     ← API pública de la librería (re-exports)
lib/src/util.ts      ← cx()
lib/src/components/  ← botones, fields, form, modal, spin
lib/src/screens/     ← pasarelas, QR, flujo de recarga (referencia)
```

## Mapa original → nuevo (comportamiento idéntico)

| Original (`old/base.js`) | Nuevo | Notas |
|---|---|---|
| `ButtonComponent`, `PrimaryButton`, `SecondaryButton` | `components/button.ts` | Mismas clases CSS y colores |
| `Input`, `Select`, `Textarea`, `Label` | `components/field.ts` | Misma clase `FORM_CONTROL_CLASSES` |
| `Field` (no existía) | `components/field.ts` | Nuevo: label + control + error + hint |
| `Form` | `components/form.ts` | Mismo `space-y-3` |
| `ModalBase`, `ModalTitle`, `ModalClose`, `ModalHeaderWithTitleAndClose`, `ModalFooterWithCloseButton`, `Modal` | `components/modal.ts` | Mismo código, solo tipado |
| `Spin` | `components/spin.ts` | Idéntico |
| `SpinModal` | `components/spin-modal.ts` | Idéntico |
| `GatewayItem`, `GatewayButton`, `GatewaysList` | `screens/gateways.ts` | Mismas clases y estructura |
| `RechargeAmount`, `RechargeAmountModal`, `RechargeQr`, `RechargeQrModal` | `screens/recharge.ts` | Mismos textos y clases |
| `QRGenerator` (clase estática) | `screens/qr.ts` | Ver "cambios de implementación" |
| `RechargeModule` | `screens/recharge-module.ts` | Misma lógica y mensajes |
| Datos embebidos al final de `base.js` | `examples/demo.js` | `gateways` igual; `params` recortado a los campos usados |

## Cambios de comportamiento (los únicos que importan)

1. **Bug del mensaje de validación (corregido).** En el original el error se
   renderizaba con `() => error.val && div(...)` (devolvía `""`, el binding de
   VanJS quedaba vivo). Al trasladar el error a `Field` se devolvía `null`, y
   VanJS descarta los bindings cuyo `_dom` no está conectado (`keepConnected`
   en `updateDoms`): el mensaje jamás se mostraba. **Fix:** devolver `""` en
   vez de `null` (regla: un binding de VanJS nunca debe devolver `null`;
   usar `""` o `div()` para el caso vacío).
2. **`Button` fuerza `type="button"` por defecto.** Antes el botón "Recargar"
   era submit por el default del browser dentro de un `<form>`. Ahora hay que
   pasar `type: "submit"` explícito (ya está en `RechargeAmount`). Cambio de
   API: botones en formularios deben indicar `type`.
3. **`handleRechargeAmount` captura errores de red.** Antes, si `fetch`
   fallaba, la excepción iba a consola y el Spin quedaba pegado. Ahora
   devuelve `{ error: "Error de conexión, intenta de nuevo" }` y el formulario
   muestra el mensaje. Mejora, no regresión.

## Cambios de implementación (mismo resultado)

- `"url" in gateway` → `typeof gateway.url === "string"` (obligatorio en TS:
  `in` no estrecha propiedades opcionales).
- Validación: `parseFloat` explícito y caso defensivo para monto vacío/`NaN`
  (el original dejaba pasar `NaN`; lo tapaba el `required` del HTML).
- `msg` state: `""` → `null` tipado (equivalente).
- `QRGenerator`: `static` → instancia por módulo (antes singleton global;
  mismo efecto) + chequeo de blob vacío.
- Endpoint e imágenes → opcionales en `RechargeModuleOptions` (`endpoint?`,
  `imagePath?`); la demo los pasa explícitamente (ya no hay constantes globales).
- Se eliminó el `console.log("result:", result)` del original.
- Concatenación de clases con `cx()` (equivalente a los template strings).

## Agregados (solo demo, no forman parte de la librería)

- `examples/mock.js` — mock del backend (`fetch` al endpoint configurado).
- `examples/index.html` — página de demo con reset CSS mínimo (la librería no
  impone estilos globales; eso es del consumidor).
- `examples/serve.js` — servidor estático con bun.

## Decisión de diseño posterior: escala de tamaños (2026-08-08)

Los tamaños heredados del original (pensados para móvil/recarga) se redujeron a
un scale estándar tipo bootstrap/shadcn/mantine, solo strings de clase:

- Botones: `text-2xl p-4` → `text-base px-4 py-2 rounded-md shadow-sm`
- Inputs/Select/Textarea: `text-xl p-4` → `text-base p-2.5 rounded-md`
- Label: `text-xl font-semibold` → `text-sm font-medium`
- Modal: `p-12` → `p-6`; título `text-3xl` → `text-xl`; cierre y footer ajustados
- Tarjetas de pasarela: `h-25 rounded-xl shadow-md` → `h-20 rounded-lg shadow-sm`
- QR: textos `text-2xl/text-xl` → `text-xl/text-sm`; padding `p-6` → `p-4`
- Spin: `py-12 h-12 w-12 text-lg` → `py-8 h-10 w-10 text-base`

## Rebranding: VanUI + tema con variables CSS (2026-08-08)

La librería se desacopla del origen (flujo de recarga de CakePHP): ahora es
`vanui`, una librería universal de componentes VanJS. La demo conserva el flujo
de recarga como ejemplo, pero el endpoint y las imágenes pasan a ser
configuración de la demo (`examples/demo.js`), no de la librería.

- `package.json` → `name: "vanui"`, descripción sin referencias al origen.
- `src/util.ts` → solo `cx()`; se eliminaron `DEFAULT_ENDPOINT` /
  `DEFAULT_IMAGE_PATH`.
- `RechargeModule` recibe `{ endpoint?, imagePath? }` en el constructor.
- Las clases de color/radio/sombra se tokenizaron: en vez de `green-500`,
  `gray-300`, `blue-600`… ahora usan tokens semánticos (`bg-primary`,
  `text-muted`, `border-border`, `focus:ring-focus`, …).
- El tema se define con variables CSS `--vui-*` en `:root` (preflight de
  `scripts/uno.js`): el consumidor re-tematiza sobreescribiendo las variables
  en su propio CSS (cargado después de `uno.css`).
- `scripts/uno.js` compila las clases a `examples/dist/uno.css` con
  `@unocss/core` + `@unocss/preset-uno`; **el theme se pasa al `createGenerator`
  (config), no dentro de `presetUno({ theme })`** — en UnoCSS 66.7.5 el theme
  del preset no aplica las clases de color custom ni los overrides de
  radio/sombra, el de config sí.

Paleta por defecto (los mismos valores que las clases originales):

| Token | Valor | | Token | Valor |
|---|---|---|---|---|
| `--vui-primary` | `#22c55e` | | `--vui-primary-hover` | `#16a34a` |
| `--vui-primary-active` | `#15803d` | | `--vui-primary-fg` | `#ffffff` |
| `--vui-primary-shadow` | `rgb(34 197 94 / .5)` | | `--vui-secondary` | `#d1d5db` |
| `--vui-secondary-hover` | `#9ca3af` | | `--vui-secondary-active` | `#6b7280` |
| `--vui-secondary-fg` | `#1f2937` | | `--vui-accent` | `#2563eb` |
| `--vui-accent-hover` | `#1d4ed8` | | `--vui-focus` | `#3b82f6` |
| `--vui-background` | `#ffffff` | | `--vui-foreground` | `#111827` |
| `--vui-foreground-soft` | `#374151` | | `--vui-muted` | `#6b7280` |
| `--vui-border` | `#d1d5db` | | `--vui-overlay` | `rgb(0 0 0 / .5)` |
| `--vui-destructive` | `#dc2626` | | | |

Radios (`--vui-radius-md/lg/2xl/full`) y sombras (`--vui-shadow-sm/lg/xl/2xl`)
con sus valores estándar (0.375rem, 0.5rem, 1rem, 9999px y las sombras de
tailwind).

## Fase 2: Button unificado con variant/size (2026-08-08)

`PrimaryButton` / `SecondaryButton` se unifican en `Button({ variant, size })`:

- `variant`: `"primary"` (default) | `"secondary"`
- `size`: `"sm"` | `"md"` (default) | `"lg"` — `px-3 py-1.5 text-sm`,
  `px-4 py-2 text-base`, `px-6 py-3 text-lg`
- `PrimaryButton` / `SecondaryButton` siguen existiendo como wrappers de
  compatibilidad (delegan en `Button`), así no se rompe ningún consumidor.

## Fase 3: tests, catálogo y screens login/register (2026-08-08)

- **Tests** (`bun test`, DOM mínimo con `@happy-dom/global-registrator`):
  `tests/` cubre button (variantes/tamaños/wrappers), field (label, hint y la
  regresión del error reactivo `null` → `""`), modal (open/close, zonas,
  contenido directo) y spin. Dos aprendizajes que quedaron documentados en los
  tests:
  - VanJS actualiza los bindings en un microtask: los tests reactivos deben
    esperarlo (`await tick()`).
  - El `preload` de bun se configura en `bunfig.toml` con `[test] preload`
    (no `setup`).
- **Mejora de `ModalBase`**: las zonas (`header`/`body`/`footer`) ahora aceptan
  contenido directo (strings, nodos) además de funciones — antes un string
  crasheaba (`body.val is not a function`). `null` sigue ocultando la zona.
- **Screens nuevas**: `screens/login.ts` (`LoginForm`) y `screens/register.ts`
  (`RegisterForm`), con `handleLogin`/`handleRegister` inyectables (se prueban
  con mock en la demo) y validación por campo (requeridos, formato de email,
  mínimo 6 caracteres, confirmación de contraseña).
- **Catálogo y páginas demo**: `examples/components.html` (botones variantes ×
  tamaños, campos, modal, spin) y `examples/login.html` / `register.html`;
  `index.html` pasó a un shell común (`examples/demo.css`) con nav entre
  páginas. `demo:build` genera 4 bundles y `uno.js` escanea `examples/*.html`.

## Fase 4: separación paquete/demo — vanui/ + demo/ (2026-08-09)

La librería y su demo se separan en dos proyectos (monorepo plano, sin
workspaces: la demo consume `vanui` como dependencia `file:`):

```
prueba/
├── old/          ← monolito original (intacto, referencia versionada)
├── vanui/        ← paquete: src/, tests/, package.json (name: "vanui")
└── demo/         ← consumidor: html, bundles, screens de recarga, img,
                   mock, serve, scripts/uno.js
```

- `lib/` desaparece: `src/` y `tests/` → `vanui/`; `examples/` y
  `scripts/uno.js` → `demo/`.
- La demo importa `from "vanui"` (nunca rutas relativas al paquete);
  `demo/package.json` declara `"vanui": "file:../vanui"`.
- `vanui` queda con deps mínimas (`vanjs-core`); `qr-code-styling` y
  `@unocss/*` pasan a la demo (los usa solo ella).
- `uno.js` escanea `../vanui/src/**/*.ts` + archivos de la demo → `demo/dist/uno.css`
  (las clases de los componentes del paquete alimentan el CSS de la demo).
- Comandos: `cd vanui && bun run typecheck && bun test`;
  `cd demo && bun run build && bun run demo`.

## Fase 5: Field/Form a fábricas — fin de las clases (2026-08-10)

El esquema de la librería es **funciones fábrica** (Button, Modal, Spin, Input,
Select, Textarea, Label, screens). `Field` (y los tipados) y `Form` eran la
excepción: clases. Se unifican:

- `Field` → `Field(config, validators?)`: `config` con `label`, `name`,
  `inputType?`, `placeholder?`, `hint?` y `control?` (reemplazo funcional del
  `control()` protected). Devuelve `{ name, error, addValidator, validate, dom }`
  — `error` pasa de `protected` a parte pública del contrato (los tests ya la
  leían).
- `TextField(label, name, placeholder?)`, `EmailField(label?, name?,
  placeholder?)`, `PasswordField(label?, name?, placeholder?, min?)` — mismas
  firmas posicionales de antes, sin `new`.
- `Form(handler)` → `{ add(...fields), dom(...footer) }`, misma semántica
  (valida todos los campos y solo llama al handler si pasan).
- Callers migrados: `screens/login.ts`, `screens/register.ts`, `tests/`,
  `demo/components.js`, `demo/screens/recharge.ts`; README actualizado.
- `Validator` (ahora `interface`) y sus subclases también pasan a fábricas con
  arrow methods, eliminando el binding de `this`. `old/` queda intacto como
  referencia versionada.

## Verificación

```sh
cd vanui
bun run typecheck   # tsc --noEmit
bun test            # 24 tests, happy-dom

cd ../demo
bun run typecheck   # tsc --noEmit (screens .ts)
bun run build       # bundles (demo, login, register, components) + uno.css
bun run demo        # http://localhost:3000
```
