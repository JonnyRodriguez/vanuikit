// demo/pages/components.page.ts
/**
 * ComponentsPage — Catálogo visual interactivo de componentes de la librería.
 */
import { van } from "vanui";
import type { ChildDom } from "vanjs-core";
import {
  Button,
  Select,
  Textarea,
  Label,
  TextField,
  EmailField,
  PasswordField,
  Modal,
  Spin,
  Match,
} from "vanui";

const { div, h2, option } = van.tags;

const section = (title: string, ...children: ChildDom[]) =>
  div(
    { class: "mb-8" },
    h2({ class: "text-lg font-bold text-accent mb-3" }, title),
    ...children,
  );

export const ComponentsPage = () => {
  const { div } = van.tags;

  // ---- Modal ----
  const modal = Modal();
  modal.mount();

  // ---- Botones: variantes x tamaños ----
  const buttons = div(
    { class: "flex flex-wrap gap-2 items-center" },
    (["primary", "secondary"] as const).flatMap((variant) =>
      (["sm", "md", "lg"] as const).map((size) =>
        Button({ variant, size }, `${variant} ${size}`),
      ),
    ),
  );

  // ---- Campos: unidades completas (label + control + validación) ----
  const fields = div(
    { class: "max-w-sm" },
    TextField("Nombre", "name", "Tu nombre").dom(),
    EmailField().dom(),
    PasswordField().dom(),
    div(
      { class: "mb-4" },
      Label({}, "País"),
      Select(
        { name: "country" },
        option({ value: "" }, "Selecciona..."),
        option({ value: "cl" }, "Chile"),
        option({ value: "mx" }, "México"),
      ),
    ),
    div(
      { class: "mb-4" },
      Label({}, "Comentarios"),
      Textarea({ name: "notes", rows: 3 }),
    ),
  );

  const confirmField = PasswordField("Confirmar contraseña", "confirm");
  confirmField.addValidator(Match("password", "Las contraseñas no coinciden"));

  const extraFieldDemo = div(
    { class: "max-w-sm mb-4" },
    confirmField.dom(),
  );
  const spin = div({ class: "py-2" }, Spin("Cargando..."));

  return div(
    { class: "page" },
    h2({ class: "text-2xl font-bold text-center mb-6" }, "Catálogo de componentes"),
    section("Botones", buttons),
    section(
      "Campos",
      fields,
      extraFieldDemo,
      div(
        { class: "mt-4" },
        Button(
          {
            variant: "primary",
            onclick: () => {
              modal.set({
                title: "Formulario",
                body: "¡Formulario enviado con éxito!",
              }, true);
            },
          },
          "Enviar",
        ),
      ),
    ),
    section(
      "Modal",
      Button(
        {
          variant: "secondary",
          size: "sm",
          onclick: () =>
            modal.set(
              {
                title: "Modal de ejemplo",
                body: "Contenido directo (acepta strings o funciones)",
              },
              true,
            ),
        },
        "Abrir modal",
      ),
    ),
    section("Spin", spin),
  );
};
