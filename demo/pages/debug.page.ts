// demo/pages/debug.page.ts
/**
 * DebugPage — vista visual del árbol de dependencias reactivas (modo debug).
 *
 * Solo está disponible cuando el modo debug está activo (localStorage
 * "van-debug"=1 o ?van-debug en la URL). Renderiza:
 *   · el grafo de dependencias: derives (columna izquierda) → estados
 *     (columna derecha); flechas sólidas = lee, discontinuas rojas = escribe,
 *   · los diagnósticos acumulados de `installVanDebug` con su origen.
 *
 * El SVG se genera como string (innerHTML) para respetar el namespace SVG,
 * que los tags de van no garantizan.
 */
import { van } from "vanui";
import type { VanDebugApi, VanDebugDiagnostic, VanDebugGraph } from "vanui";

const KIND_STYLE: Record<string, { label: string; cls: string }> = {
  "state-in-derive": { label: "ESTADO EN DERIVE", cls: "bg-red-100 text-red-700 border-red-300" },
  "derive-writes-state": { label: "DERIVE ESCRIBE", cls: "bg-orange-100 text-orange-700 border-orange-300" },
  "derive-cycle": { label: "CICLO", cls: "bg-red-100 text-red-700 border-red-300" },
  "derive-no-deps": { label: "SIN DEPS", cls: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  "container-reactive-reads": { label: "CONTENEDOR REACTIVO", cls: "bg-amber-100 text-amber-800 border-amber-300" },
};

const GRAPH_W = 980;
const COL_DERIVE_X = 40;
const COL_STATE_X = 640;
const COL_W = 300;
const ROW_H = 44;
const HEADER_H = 40;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function buildGraphSvg(g: VanDebugGraph): string {
  const deriveCount = g.derives.length;
  const stateCount = g.states.length;
  const height = HEADER_H + Math.max(deriveCount, stateCount, 1) * ROW_H + 30;

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${GRAPH_W}" height="${height}" viewBox="0 0 ${GRAPH_W} ${height}" class="w-full h-auto" style="font-family:ui-monospace,monospace;font-size:11px">`,
  );
  parts.push(
    `<text x="${COL_DERIVE_X}" y="24" font-weight="700" fill="#334155">DERIVES</text>`,
    `<text x="${COL_STATE_X}" y="24" font-weight="700" fill="#334155">ESTADOS</text>`,
  );

  const deriveY = (i: number) => HEADER_H + i * ROW_H + ROW_H / 2;
  const stateY = (i: number) => HEADER_H + i * ROW_H + ROW_H / 2;

  const stateIndex = new Map<number, number>();
  g.states.forEach((s, i) => stateIndex.set(s.id, i));

  // Edges detrás de los nodos.
  g.derives.forEach((d, i) => {
    for (const depId of d.deps) {
      const j = stateIndex.get(depId);
      if (j === undefined) continue;
      const isWrite = d.writes.includes(depId);
      const x1 = COL_DERIVE_X + COL_W;
      const x2 = COL_STATE_X;
      const y1 = deriveY(i);
      const y2 = stateY(j);
      const mid = (x1 + x2) / 2;
      const color = isWrite ? "#dc2626" : "#64748b";
      const dash = isWrite ? ' stroke-dasharray="5,4"' : "";
      parts.push(
        `<path d="M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${isWrite ? 1.6 : 1.2}"${dash} marker-end="url(#arrow-${isWrite ? "write" : "read"})" opacity="${isWrite ? 0.95 : 0.7}" />`,
      );
    }
  });

  parts.push(
    `<defs>` +
      `<marker id="arrow-read" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#64748b"/></marker>` +
      `<marker id="arrow-write" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#dc2626"/></marker>` +
      `</defs>`,
  );

  g.derives.forEach((d, i) => {
    const y = deriveY(i) - 12;
    const cls = d.deps.length === 0 ? "fill:#fef3c7;stroke:#f59e0b" : d.writes.length ? "fill:#ffedd5;stroke:#f97316" : "fill:#f1f5f9;stroke:#94a3b8";
    parts.push(
      `<g>` +
        `<rect x="${COL_DERIVE_X}" y="${y}" width="${COL_W}" height="24" rx="6" style="${cls};stroke-width:1.2" />` +
        `<text x="${COL_DERIVE_X + 8}" y="${y + 16}" fill="#0f172a">${esc(truncate(d.label, 34))}</text>` +
        `<text x="${COL_DERIVE_X + COL_W - 6}" y="${y + 16}" text-anchor="end" fill="#64748b">${d.deps.length} deps</text>` +
        `</g>`,
    );
  });

  g.states.forEach((s, i) => {
    const y = stateY(i) - 12;
    parts.push(
      `<g>` +
        `<rect x="${COL_STATE_X}" y="${y}" width="${COL_W}" height="24" rx="6" style="fill:#eef2ff;stroke:#818cf8;stroke-width:1.2" />` +
        `<text x="${COL_STATE_X + 8}" y="${y + 16}" fill="#1e1b4b">${esc(truncate(s.label, 34))}</text>` +
        `<circle cx="${COL_STATE_X + COL_W - 12}" cy="${y + 12}" r="4" fill="#6366f1" />` +
        `</g>`,
    );
  });

  parts.push(`</svg>`);
  return parts.join("");
}

function diagnosticCard(d: VanDebugDiagnostic): string {
  const st = KIND_STYLE[d.kind] ?? { label: d.kind, cls: "bg-slate-100 text-slate-700 border-slate-300" };
  const origin = d.origin ? `<div class="text-xs text-slate-500 mt-1 font-mono">en ${esc(d.origin)}</div>` : "";
  return (
    `<div class="border rounded-lg p-3 ${st.cls}">` +
    `<div class="text-[10px] font-bold uppercase tracking-wide">${esc(st.label)}</div>` +
    `<div class="text-sm mt-0.5">${esc(d.message)}</div>` +
    origin +
    `</div>`
  );
}

export const DebugPage = (): Node => {
  const { div, h1, p, button } = van.tags;

  const dbg = (window as unknown as { __vanDebug?: VanDebugApi }).__vanDebug;

  const root = div({ class: "max-w-5xl mx-auto p-6 space-y-6" });
  const graphBox = div();
  const diagBox = div({ class: "grid grid-cols-1 md:grid-cols-2 gap-3" });
  const statsLine = p({ class: "text-sm text-slate-600" });

  const render = () => {
    if (!dbg) {
      root.replaceChildren(
        h1({ class: "text-xl font-bold" }, "Debug de reactividad"),
        p({ class: "text-slate-600" }, "Modo debug no activo. Recargá la página con ?van-debug o activá localStorage van-debug=1."),
      );
      return;
    }
    const g = dbg.dump();
    graphBox.innerHTML = buildGraphSvg(g);
    diagBox.innerHTML = g.diagnostics.length ? g.diagnostics.map(diagnosticCard).join("") : "<p class='text-green-700 text-sm'>Sin violaciones detectadas ✅</p>";
    statsLine.textContent = `${g.derives.length} derives · ${g.states.length} estados · ${g.diagnostics.length} diagnósticos`;
  };

  root.append(
    h1({ class: "text-xl font-bold" }, "Debug de reactividad (VanJS)"),
    div(
      { class: "flex items-center gap-3 flex-wrap" },
      button(
        {
          class: "px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 cursor-pointer",
          onclick: () => render(),
        },
        "Refrescar grafo",
      ),
      dbg
        ? button(
            {
              class: "px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm hover:bg-slate-300 cursor-pointer",
              onclick: () => {
                dbg.clear();
                render();
              },
            },
            "Limpiar diagnósticos",
          )
        : null,
    ),
    statsLine,
    graphBox,
    div({ class: "text-xs text-slate-400" }, "Flechas sólidas = lee · discontinuas rojas = escribe (feedback) · nodos naranjas = derive con escrituras · amarillos = sin deps"),
    div({ class: "text-sm font-semibold mt-2" }, "Diagnósticos"),
    diagBox,
  );

  render();
  return root as unknown as Node;
};
