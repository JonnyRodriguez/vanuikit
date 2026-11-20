/**
 * Demo SPA entry point.
 *
 * Inspired by store/web/src/index.ts: mounts `App()` in <div id="app">
 * once the DOM is loaded. All the demo's JS (router, screens, nav) is
 * bundled into a single bundle that this file imports.
 */
import { van } from "vanuikit";
import { App } from "./app.js";

// VanJS debug mode (optional): detects violations of the reactive rules
// (van.state inside derive, reactive containers, cycles).
// Enabled via localStorage "van-debug"=1 or the ?van-debug parameter.
if (
  typeof localStorage !== "undefined" &&
  (localStorage.getItem("van-debug") === "1" ||
    new URLSearchParams(window.location.search).has("van-debug"))
) {
  const { installVanDebug } = await import("vanuikit");
  const debug = installVanDebug(van);
  (window as unknown as { __vanDebug: typeof debug }).__vanDebug = debug;
  console.info("[vanuikit:debug] debug mode on — localStorage van-debug=1 or ?van-debug (view: /debug)");
}

const mount = () => {
  const root = document.getElementById("app");
  if (root) {
    van.add(root, App());
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
