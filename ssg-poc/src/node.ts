// ssg-poc/src/node.ts
/**
 * Puente de tipos: vanui declara los retornos de sus componentes como
 * ChildDom (unión amplia: strings, States, funciones, undefined), mientras
 * el router de vanui (RouteFactory → Node) y los bindings-función de van
 * (→ ValidChildDomValue) esperan nodos. En este sitio todo lo que se
 * compone son elementos reales — el cast sólo estrecha el tipo.
 */
import type { ChildDom } from "vanjs-core";

export const asNode = (child: ChildDom): Node =>
  child instanceof Node ? child : document.createTextNode(String(child ?? ""));
