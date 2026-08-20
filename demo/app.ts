/**
 * App — raíz de la SPA demo.
 *
 * Patrón store/web: el Router viene de la librería (vanui), se registran
 * rutas declarativas y cada pantalla es dueña de sus propios datos.
 * App es solo el shell: título + Nav compartido + la pantalla que
 * resuelve el router.
 *
 * Rutas:
 *   /            → redirige a /gateways
 *   /gateways    → flujo de recarga (lista de pasarelas → modal monto → QR)
 *   /login       → formulario de login
 *   /register    → formulario de registro
 *   /components  → catálogo de componentes
 */
import { van, Nav, Router } from "vanui";
import { GatewaysScreen } from "./screens/gateways-screen.js";
import { LoginScreen } from "./screens/login-screen.js";
import { RegisterScreen } from "./screens/register-screen.js";
import { ComponentsScreen } from "./screens/components-screen.js";

const { div, h1 } = van.tags;
export const router = new Router();

// ---------------------------------------------------------------------------
// Navegación compartida (rendered una sola vez en el shell de App).
// ---------------------------------------------------------------------------
export const NAV_LINKS = [
  { href: "/gateways", label: "Recarga" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Registro" },
  { href: "/components", label: "Componentes" },
];

// ---------------------------------------------------------------------------
// Registro de rutas (patrón store/web: router.add(path, () => Component))
// ---------------------------------------------------------------------------
function registerRoutes() {
  router
    .redirect("/", "/gateways")
    .add("/gateways", () => GatewaysScreen())
    .add("/login", () => LoginScreen({ router }))
    .add("/register", () => RegisterScreen({ router }))
    .add("/components", () => ComponentsScreen())
    .setNotFound(
      () =>
        div(
          { class: "text-center p-8" },
          van.tags.h2({ class: "text-xl font-bold mb-2" }, "404"),
          van.tags.p({ class: "text-muted" }, "Página no encontrada"),
        ),
    );
}

// ---------------------------------------------------------------------------
// App — shell: título + Nav compartido + pantalla resuelta por el router.
// La función devuelve el nodo reactivo que se monta en <div id="app">.
// ---------------------------------------------------------------------------
export const App = () => {
  registerRoutes();
  return div(
    { class: "app-shell" },
    h1({ class: "demo-title" }, "VanUI — Demo"),
    // Nav reactivo: `router.path` cambia al navegar y el link activo se resalta.
    () => Nav(NAV_LINKS, { current: router.path.val }),
    router.start(),
  );
};