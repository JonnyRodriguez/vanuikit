/**
 * Standalone static entry point for the component playground.
 *
 * Mounts only the component showcase (`ComponentsPage`) — no router, no auth,
 * no backend. The shared i18n/theme configs register translations and persist
 * preferences in localStorage, just like the full demo.
 */
import { van } from "vanuikit";
import "./shared/i18n.config.js";
import { ComponentsPage } from "./pages/components.page.js";

const mount = () => {
  const root = document.getElementById("app");
  if (root) {
    van.add(root, ComponentsPage());
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
