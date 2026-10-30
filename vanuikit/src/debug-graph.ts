/**
 * debug-graph.ts — instrumentador de VanJS en modo desarrollo.
 *
 * Opciones-instala `van.state`/`van.derive` para construir el *árbol de
 * dependencias* real (qué derive lee qué estados) y detectar en el momento de
 * la violación las reglas silenciosas documentadas en AGENTS.md:
 *
 *  - R1 (state-in-derive):  `van.state()` creado DENTRO de un `van.derive`.
 *  - R2 (derive-writes-state): un derive escribe estados durante su cómputo
 *    (feedback; si además los leyó → ciclo).
 *  - R3 (derive-no-deps):   un derive sin lecturas (no es reactivo).
 *  - R4 (container-reactive-reads): una función de render lee estados reactivos
 *    (reconstruirá su subárbol; solo se reporta si pasó por `trackRender` o si
 *    la función fue marcada con `renderIntentional` → se suprime).
 *
 * Uso (dev-only):
 *
 *   import { van, installVanDebug } from "vanuikit";
 *   const debug = installVanDebug(van);
 *   // ... arrancar la app ...
 *   debug.printTree();   // grafo en consola
 *   debug.dump();        // grafo serializable
 *
 * En producción NO se importa ni se llama: el módulo no tiene efectos al
 * importarse (solo define funciones) y el bundle lo elimina por tree-shaking.
 */

import type { State } from "vanjs-core";

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export type ViolationKind =
  | "state-in-derive"
  | "derive-writes-state"
  | "derive-cycle"
  | "derive-no-deps"
  | "container-reactive-reads";

export interface VanDebugDiagnostic {
  kind: ViolationKind;
  message: string;
  origin?: string;
}

export interface VanDebugNode {
  id: number;
  label: string;
}

export interface VanDebugDerive extends VanDebugNode {
  deps: number[]; // ids de estados que lee
  writes: number[]; // ids de estados que escribe durante el cómputo
}

export interface VanDebugGraph {
  states: VanDebugNode[];
  derives: VanDebugDerive[];
  diagnostics: VanDebugDiagnostic[];
}

export interface VanDebugApi {
  /** Devuelve el grafo serializable actual. */
  dump(): VanDebugGraph;
  /** Imprime el grafo en consola (árbol derive → estados). */
  printTree(): void;
  /** Diagnósticos acumulados. */
  diagnostics(): readonly VanDebugDiagnostic[];
  /** Limpia estados, derives y diagnósticos (para tests). */
  clear(): void;
  /**
   * Ejecuta `fn` bajo un marco de tipo "render" (función contenedora).
   * Si `fn` lee estados reactivos, reporta R4. Útil para verificar
   * contenedores sospechosos durante el desarrollo.
   */
  trackRender<T>(fn: () => T, label?: string): T;
  /**
   * Marca una función render como intencionalmente reactiva: si se pasa por
   * `trackRender`, la lectura de estados NO se reporta (rebuild a propósito).
   */
  renderIntentional<T extends (...args: never[]) => unknown>(fn: T): T;
  /** silence: true → no imprime warnings (solo acumula). */
  configure(opts: { silent?: boolean }): void;
}

// ---------------------------------------------------------------------------
// Estado interno
// ---------------------------------------------------------------------------

interface StateMeta {
  id: number;
  label: string;
  reads: number;
}

interface Frame {
  kind: "derive" | "render";
  label: string;
  deps: Set<StateMeta>;
  writes: Set<StateMeta>;
  parent: Frame | null;
  origin?: string;
}

const stateMeta = new WeakMap<object, StateMeta>();
const states = new Map<number, StateMeta>();
let stateSeq = 0;
const derives: VanDebugDerive[] = [];
const diagnostics: VanDebugDiagnostic[] = [];
let silent = false;
let activeFrame: Frame | null = null;
const intentionalRender = new WeakMap<object, true>();
const hookedStates = new WeakMap<object, true>();
let installedApi: VanDebugApi | undefined;

function metaOf(state: object): StateMeta {
  let m = stateMeta.get(state);
  if (!m) {
    m = { id: ++stateSeq, label: `state#${stateSeq}`, reads: 0 };
    stateMeta.set(state, m);
    states.set(m.id, m);
  }
  return m;
}

function captureCallSite(): string | undefined {
  const stack = new Error().stack?.split("\n") ?? [];
  for (const line of stack.slice(2)) {
    const t = line.trim();
    if (t.startsWith("at ")) return t;
  }
  return undefined;
}

function report(kind: ViolationKind, message: string, origin?: string): void {
  const d: VanDebugDiagnostic = { kind, message, origin: origin ?? captureCallSite() };
  diagnostics.push(d);
  if (!silent) {
    console.warn(`[vanuikit:debug] ${kind} — ${message}`);
    if (d.origin) console.warn(`  en ${d.origin}`);
  }
}

// ---------------------------------------------------------------------------
// Instrumentación de estados
// ---------------------------------------------------------------------------

function findValDescriptor(obj: object): PropertyDescriptor | undefined {
  let cur: object | null = obj;
  while (cur) {
    const d = Object.getOwnPropertyDescriptor(cur, "val");
    if (d) return d;
    cur = Object.getPrototypeOf(cur);
  }
  return undefined;
}

function hookState(state: State<unknown>, label?: string): State<unknown> {
  if (hookedStates.has(state)) return state;
  hookedStates.set(state, true);

  const m = metaOf(state);
  if (label) m.label = label;

  const desc = findValDescriptor(state);
  // Si el estado no expone `val` como accessor, no podemos interceptarlo sin
  // alterar su semántica: lo dejamos sin hookear.
  if (!desc || (!desc.get && !desc.set)) return state;

  Object.defineProperty(state, "val", {
    configurable: true,
    enumerable: desc.enumerable ?? true,
    get(this: unknown) {
      if (activeFrame) activeFrame.deps.add(m);
      m.reads++;
      return desc.get ? desc.get.call(this) : undefined;
    },
    set(this: unknown, v: unknown) {
      if (activeFrame) activeFrame.writes.add(m);
      if (desc.set) desc.set.call(this, v);
    },
  });

  return state;
}

// ---------------------------------------------------------------------------
// Instalación sobre una instancia de van
// ---------------------------------------------------------------------------

interface VanLike {
  state(initVal?: unknown, label?: string): State<unknown>;
  derive<T>(fn: () => T): State<T>;
}

let deriveSeq = 0;

function installVanDebug(van: VanLike): VanDebugApi {
  if (installedApi) return installedApi;
  let api!: VanDebugApi;

  const origState = van.state.bind(van);
  const origDerive = van.derive.bind(van);

  // R1: crear un estado dentro de un marco (derive/render) viola la regla.
  van.state = ((initVal?: unknown, label?: string) => {
    if (activeFrame) {
      report(
        "state-in-derive",
        `van.state() creado dentro de ${activeFrame.kind} "${activeFrame.label}" — el estado se recreará en cada recálculo y perderá su identidad. Izá el estado fuera de la función.`,
      );
    }
    return hookState(origState(initVal), label);
  }) as VanLike["state"];

  // El derive abre un marco: las lecturas de estados dentro de fn() quedan
  // registradas como dependencias del derive (el árbol de dependencias).
  van.derive = ((fn: () => unknown) => {
    const label = fn.name || `derive#${++deriveSeq}`;
    const frame: Frame = {
      kind: "derive",
      label,
      deps: new Set(),
      writes: new Set(),
      parent: activeFrame,
      origin: captureCallSite(),
    };

    const derived = origDerive(() => {
      const prev = activeFrame;
      activeFrame = frame;
      try {
        return fn();
      } finally {
        activeFrame = prev;
      }
    });

    // Fuerza la primera evaluación para cosechar las dependencias (si van aún
    // no computó el derive).
    void derived.val;

    if (frame.deps.size === 0) {
      report(
        "derive-no-deps",
        `derive "${label}" no leyó ningún estado — no es reactivo (¿usa raw()/t().val que no registró deps?).`,
        frame.origin,
      );
    }
    if (frame.writes.size > 0) {
      report(
        "derive-writes-state",
        `derive "${label}" escribe estados durante su cómputo (${[...frame.writes].map((w) => w.label).join(", ")}) — feedback reactivo peligroso.`,
        frame.origin,
      );
      for (const w of frame.writes) {
        if (frame.deps.has(w)) {
          report(
            "derive-cycle",
            `derive "${label}" lee y escribe el mismo estado "${w.label}" — ciclo de reactividad.`,
            frame.origin,
          );
        }
      }
    }

    const depIds = [...frame.deps].map((m) => m.id);
    const writeIds = [...frame.writes].map((m) => m.id);
    derives.push({ id: derives.length + 1, label, deps: depIds, writes: writeIds });

    return derived;
  }) as VanLike["derive"];

  api = {
    dump() {
      return {
        states: [...states.values()].map((m) => ({ id: m.id, label: m.label })),
        derives: derives.map((d) => ({ ...d, deps: [...d.deps], writes: [...d.writes] })),
        diagnostics: diagnostics.map((d) => ({ ...d })),
      };
    },
    printTree() {
      const byId = new Map(states.entries());
      console.group("[vanuikit:debug] árbol de dependencias");
      for (const d of derives) {
        const deps = d.deps.length
          ? d.deps.map((id) => byId.get(id)?.label ?? `#${id}`).join(", ")
          : "(sin deps)";
        const writes = d.writes.length
          ? ` [escribe: ${d.writes.map((id) => byId.get(id)?.label ?? `#${id}`).join(", ")}]`
          : "";
        console.log(`derive ${d.label} → ${deps}${writes}`);
      }
      console.groupEnd();
    },
    diagnostics() {
      return diagnostics;
    },
    clear() {
      states.clear();
      derives.length = 0;
      diagnostics.length = 0;
      stateSeq = 0;
      deriveSeq = 0;
    },
    trackRender<T>(fn: () => T, label?: string): T {
      if (intentionalRender.has(fn)) return fn();
      const frame: Frame = {
        kind: "render",
        label: label ?? fn.name ?? "render",
        deps: new Set(),
        writes: new Set(),
        parent: activeFrame,
        origin: captureCallSite(),
      };
      const prev = activeFrame;
      activeFrame = frame;
      let out: T;
      try {
        out = fn();
      } finally {
        activeFrame = prev;
      }
      if (frame.deps.size > 0) {
        report(
          "container-reactive-reads",
          `función de render "${frame.label}" leyó estados reactivos (${[...frame.deps].map((m) => m.label).join(", ")}) — reconstruirá su subárbol al cambiar esos estados. Si es intencional, envuelve la función con renderIntentional().`,
          frame.origin,
        );
      }
      return out;
    },
    renderIntentional<T extends (...args: never[]) => unknown>(fn: T): T {
      intentionalRender.set(fn, true);
      return fn;
    },
    configure(opts: { silent?: boolean }) {
      if (opts.silent !== undefined) silent = opts.silent;
    },
  };

  installedApi = api;
  return api;
}

export { installVanDebug };
