import { describe, test, expect } from "bun:test";
import van, { type State } from "vanjs-core";
import { Wizard, type WizardOptions } from "../src/components/wizard.js";
import { createQuery } from "../src/fetch.js";
import { EmailField, TextField } from "../src/components/field.js";
import type { SchemaLike } from "../src/components/form.js";
import { i18n } from "../src/i18n.js";

// Los textos del Wizard (botones, línea general) son i18n: fija español para
// que las aserciones sean deterministas. Los clicks son por posición.
i18n.setLocale("es");

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

const flush = () => new Promise((r) => setTimeout(r, 10));

/**
 * Los únicos <button> del Wizard son los del footer (indicadores y paso son
 * divs), así que se accede por posición: 0 = Atrás, último = Siguiente/Enviar.
 * Así los tests no dependen del idioma activo de i18n.
 */
const clickFooter = (node: HTMLElement, index: number) => {
  const btns = [...node.querySelectorAll("button")];
  const btn = btns[index];
  if (!btn) throw new Error(`button footer @ ${index} no existe`);
  btn.click();
};

const clickLast = (node: HTMLElement) =>
  clickFooter(node, node.querySelectorAll("button").length - 1);
const clickBack = (node: HTMLElement) => clickFooter(node, 0);

const setValue = (node: HTMLElement, name: string, value: string) => {
  const input = node.querySelector(`input[name="${name}"]`) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

const makeSchema = (failWith: Array<{ path: string; message: string }> = []): SchemaLike => ({
  safeParse: () =>
    failWith.length === 0
      ? { success: true, data: {} }
      : {
          success: false,
          error: {
            issues: failWith.map((f) => ({ path: [f.path], message: f.message })),
          },
        },
});

/** Schema que valida según el valor real del campo title (para tests de navegación). */
const titleSchema: SchemaLike = {
  safeParse: (data) =>
    (data as Record<string, unknown>)?.title
      ? { success: true, data: {} }
      : {
          success: false,
          error: {
            issues: [{ path: ["title"], message: "El título es requerido" }],
          },
        },
};

const twoStepWizard = (overrides: Partial<WizardOptions> = {}) =>
  Wizard({
    steps: [
      { title: "Básico", schema: makeSchema(), fields: [TextField({ name: "title" })] },
      { title: "Contacto", schema: makeSchema(), fields: [EmailField()] },
    ],
    onSubmit: () => ({ ok: true }),
    ...overrides,
  });

describe("Wizard — multi-paso", () => {
  test("bloquea avanzar si el paso actual es inválido", async () => {
    const failing = makeSchema([{ path: "title", message: "El título es requerido" }]);
    const w = Wizard({
      steps: [
        { title: "B", schema: failing, fields: [TextField({ name: "title" })] },
        { title: "C", fields: [] },
      ],
      onSubmit: () => ({ ok: true }),
    });
    const el = mount(w.dom());
    await flush();
    clickLast(el);
    await flush();
    expect(w.step.val).toBe(0);
    expect(el.textContent).toContain("El título es requerido");
  });

  test("acumula valores en el store y envía el merge al submit", async () => {
    let submitted: Record<string, unknown> | null = null;
    const w = twoStepWizard({ onSubmit: (data) => { submitted = data; return { ok: true }; } });
    const el = mount(w.dom());
    setValue(el, "title", "Anuncio");
    clickLast(el);
    await flush();
    expect(w.step.val).toBe(1);
    setValue(el, "email", "a@b.co");
    clickLast(el);
    await flush();
    expect(submitted).toEqual({ title: "Anuncio", email: "a@b.co" });
  });

  test("volver atrás conserva los valores sembrados desde el store", async () => {
    const w = twoStepWizard();
    const el = mount(w.dom());
    setValue(el, "title", "Anuncio");
    clickLast(el);
    await flush();
    clickBack(el);
    await flush();
    expect(w.step.val).toBe(0);
    expect((el.querySelector('input[name="title"]') as HTMLInputElement).value).toBe("Anuncio");
  });

  test("onSuccess se llama al triunfar y deja la línea general limpia", async () => {
    let success: Record<string, unknown> | null = null;
    const w = twoStepWizard({ onSuccess: (data) => { success = data; } });
    const el = mount(w.dom());
    setValue(el, "title", "X");
    clickLast(el);
    await flush();
    setValue(el, "email", "a@b.co");
    clickLast(el);
    await flush();
    expect(success).toEqual({ title: "X", email: "a@b.co" });
    expect(w.error.val).toBe("");
  });

  test("fieldErrors del backend en el paso visible se pintan en el campo", async () => {
    const w = Wizard({
      steps: [
        { title: "A", fields: [] },
        { title: "B", fields: [EmailField()] },
      ],
      onSubmit: () => ({ ok: false, fieldErrors: { email: "Ya existe" } }),
    });
    const el = mount(w.dom());
    clickLast(el);
    await flush();
    setValue(el, "email", "a@b.co");
    clickLast(el);
    await flush();
    expect(el.textContent).toContain("Ya existe");
    expect(w.error.val).toBe("");
  });

  test("fieldErrors del backend en OTRO paso caen en la línea general con hint", async () => {
    const w = Wizard({
      steps: [
        { title: "A", fields: [EmailField()] },
        { title: "B", fields: [] },
      ],
      onSubmit: () => ({ ok: false, fieldErrors: { email: "Ya existe" } }),
    });
    const el = mount(w.dom());
    setValue(el, "email", "a@b.co");
    clickLast(el);
    await flush();
    clickLast(el);
    await flush();
    expect(w.error.val).toBe("Revisa el paso 1");
  });

  test("submitting bloquea doble submit", async () => {
    let calls = 0;
    let resolveSubmit!: (r: { ok: true }) => void;
    const w = Wizard({
      steps: [
        { title: "A", fields: [] },
        { title: "B", fields: [] },
      ],
      onSubmit: () => {
        calls++;
        return new Promise<{ ok: true }>((res) => {
          resolveSubmit = () => res({ ok: true });
        });
      },
    });
    const el = mount(w.dom());
    clickLast(el);
    await flush();
    clickLast(el);
    await flush();
    expect(w.submitting.val).toBe(true);
    clickLast(el);
    await flush();
    expect(calls).toBe(1);
    resolveSubmit();
    await flush();
    expect(w.submitting.val).toBe(false);
  });
});

describe("Wizard — navegación programática (useWizard)", () => {
  test("next() valida y devuelve true/false", async () => {
    const w = Wizard({
      steps: [
        { title: "B", schema: titleSchema, fields: [TextField({ name: "title" })] },
        { title: "C", fields: [] },
      ],
      onSubmit: () => ({ ok: true }),
    });
    const el = mount(w.dom());
    await flush();
    expect(w.next()).toBe(false);
    expect(w.step.val).toBe(0);
    setValue(el, "title", "X");
    expect(w.next()).toBe(true);
    expect(w.step.val).toBe(1);
  });

  test("back() retrocede sin validar", async () => {
    const w = twoStepWizard();
    const el = mount(w.dom());
    setValue(el, "title", "Anuncio");
    expect(w.next()).toBe(true);
    w.back();
    expect(w.step.val).toBe(0);
  });

  test("goTo() salta a un paso directo y el store persiste", async () => {
    const w = Wizard({
      steps: [
        { title: "A", fields: [TextField({ name: "title" })] },
        { title: "B", fields: [EmailField()] },
        { title: "C", fields: [] },
      ],
      onSubmit: () => ({ ok: true }),
    });
    const el = mount(w.dom());
    setValue(el, "title", "Anuncio");
    expect(w.next()).toBe(true); // commitea title y pasa a B
    w.goTo(2); // salta a C, sin validar B
    expect(w.step.val).toBe(2);
    w.goTo(0); // vuelve a A
    await flush();
    expect((el.querySelector('input[name="title"]') as HTMLInputElement).value).toBe("Anuncio");
  });

  test("collectStep() mergea el store con los valores del paso", async () => {
    const w = twoStepWizard();
    const el = mount(w.dom());
    setValue(el, "title", "Anuncio");
    expect(w.collectStep(0)).toEqual({ title: "Anuncio" });
  });

  test("el contenido del paso se reconstruye al cambiar un estado (hijo-función reactivo)", async () => {
    const items = van.state<string[]>([]);
    const { div, p } = van.tags;
    const w = Wizard({
      steps: [
        {
          title: "***REMOVED***",
          collect: () => ({}),
          content: [() => (items.val.length ? div(items.val.map((i) => p(i))) : "")],
        },
        { title: "Monto", fields: [] },
      ],
      onSubmit: () => ({ ok: true }),
    });
    const el = mount(w.dom());
    await flush();
    expect(el.textContent).not.toContain("Provider-A");
    items.val = ["Provider-A", "Providers-B"];
    await flush();
    expect(el.textContent).toContain("Provider-A");
    expect(el.textContent).toContain("Providers-B");
  });

  test("***REMOVED***: createQuery + contenido reactivo listan las ***REMOVED***s", async () => {
    const ***REMOVED*** = [
      { id: "PROVIDER-A", name: "Provider-A", img: "/img/provider-a.svg" },
      { id: "PROVIDERS-B", name: "Providers-B", img: "/img/providers-b.svg" },
    ];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any) => {
      if (String(url).includes("/api/***REMOVED***/***REMOVED***")) {
        return new Response(JSON.stringify({ status: "ok", data: ***REMOVED*** }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ status: "ok", data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const q = createQuery<any[]>("/api/***REMOVED***/***REMOVED***", {
      transform: (j: any) => j.data,
    });
    const { div, p } = van.tags;
    const w = Wizard({
      steps: [
        { title: "***REMOVED***", content: [() => div((q.data.val || []).map((g) => p(g.name)))] },
        { title: "Monto", fields: [] },
      ],
      onSubmit: () => ({ ok: true }),
    });
    const el = mount(w.dom());
    await flush();
    await flush();
    expect(el.textContent).toContain("Provider-A");
    expect(el.textContent).toContain("Providers-B");
    globalThis.fetch = realFetch;
  });

  test("validateCurrent() refleja la validez del paso actual", async () => {
    const w = Wizard({
      steps: [
        { title: "B", schema: titleSchema, fields: [TextField({ name: "title" })] },
        { title: "C", fields: [] },
      ],
      onSubmit: () => ({ ok: true }),
    });
    const el = mount(w.dom());
    expect(w.validateCurrent()).toBe(false);
    setValue(el, "title", "X");
    expect(w.validateCurrent()).toBe(true);
  });
});
