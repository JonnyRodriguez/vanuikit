// ssg-poc/src/pages/not-found.page.ts
import { van, i18n, Link, raw } from "vanui";
import type { ChildDom } from "vanjs-core"; // type-only: se borra en build
import type { Locale } from "../config.js";
import { Layout } from "../layout.js";

/**
 * Vista 404 (slug inexistente o locale no soportado).
 *
 * Es la única vista que renderiza cuando el locale NO quedó garantizado
 * (locale inválido en la URL, o notFound del router sin contexto) — así que
 * fija el locale de su árbol antes de resolver textos.
 */
export const NotFoundView = (locale: Locale): ChildDom => {
  i18n.setLocale(locale);
  const { div, h1 } = van.tags;
  return Layout(
    locale,
    div(
      { class: "not-found" },
      h1(raw("site.notFoundTitle", "Producto no encontrado")),
      Link({ href: `/${locale}/productos`, variant: "accent" }, raw("site.notFoundBack", "← Catálogo")),
    ),
  );
};
