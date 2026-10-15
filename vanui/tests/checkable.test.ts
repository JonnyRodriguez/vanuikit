import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { Checkbox } from "../src/components/checkbox.js";
import { Switch } from "../src/components/switch.js";
import { RadioGroup } from "../src/components/radio.js";
import { TextareaField } from "../src/components/field.js";
import { Form } from "../src/components/form.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

// VanJS actualiza los bindings en un microtask; hay que esperarlo.
const tick = () => new Promise((r) => setTimeout(r, 0));

/** Dispara submit sobre el form y espera el flujo async. */
const submit = async (formEl: HTMLFormElement) => {
  formEl.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  await tick();
};

/** Simula la interacción del usuario sobre un radio/checkbox oculto. */
const check = (input: HTMLInputElement, checked: boolean) => {
  input.checked = checked;
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("Checkbox — standalone", () => {
  test("alterna el estado y pinta la caja en consecuencia", async () => {
    const cb = Checkbox({ name: "news", label: "Novedades" });
    const el = mount(cb.dom() as HTMLElement);
    const input = el.querySelector("input[type=checkbox]") as HTMLInputElement;

    expect(input.checked).toBe(false);
    check(input, true);
    expect(cb.checked.val).toBe(true);
    await tick();
    expect(el.querySelector("span[aria-hidden]")!.className).toContain("bg-accent");

    check(input, false);
    expect(cb.checked.val).toBe(false);
    await tick();
    expect(el.querySelector("span[aria-hidden]")!.className).toContain("bg-card");
  });

  test("un State externo manda sobre el input, en ambas direcciones", async () => {
    const source = van.state(true);
    const cb = Checkbox({ name: "sync", checked: source });
    const el = mount(cb.dom() as HTMLElement);
    const input = el.querySelector("input[type=checkbox]") as HTMLInputElement;

    expect(input.checked).toBe(true);
    source.val = false;
    await tick();
    expect(input.checked).toBe(false);

    check(input, true);
    expect(source.val).toBe(true);
  });

  test("indeterminate se refleja en el input y muestra el guion", async () => {
    const ind = van.state(true);
    const cb = Checkbox({ name: "all", indeterminate: ind });
    const el = mount(cb.dom() as HTMLElement);
    const input = el.querySelector("input[type=checkbox]") as HTMLInputElement;

    await tick();
    expect(input.indeterminate).toBe(true);
    const dash = el.querySelectorAll("svg path")[1] as SVGPathElement;
    expect(dash.getAttribute("class")).toContain("opacity-100");

    ind.val = false;
    await tick();
    expect(input.indeterminate).toBe(false);
    expect(dash.getAttribute("class")).toContain("opacity-0");
  });

  test("validate(raw) sincroniza el estado: 'on' marca, '' desmarca", () => {
    const cb = Checkbox({ name: "raw" });
    expect(cb.validate("on")).toBe(true);
    expect(cb.checked.val).toBe(true);
    expect(cb.validate("")).toBe(true);
    expect(cb.checked.val).toBe(false);
  });
});

describe("Checkbox — integración con Form", () => {
  test("required: bloquea el submit desmarcado, lo permite marcado", async () => {
    let called = false;
    let data: Record<string, unknown> | null = null;
    const form = Form((d) => {
      called = true;
      data = d;
    });
    form.add(Checkbox({ name: "terms", label: "Términos", required: true }));

    const el = mount(form.dom() as HTMLFormElement);
    await submit(el);

    expect(called).toBe(false);
    expect(el.textContent).toContain("You must check this option");

    check(el.querySelector("input[name=terms]") as HTMLInputElement, true);
    await submit(el);

    expect(called).toBe(true);
    expect(data).toEqual({ terms: "on" });
  });
});

describe("Switch", () => {
  test("role=switch, alterna y pinta el track", async () => {
    const sw = Switch({ name: "notif", label: "Notificaciones" });
    const el = mount(sw.dom() as HTMLElement);
    const input = el.querySelector('input[role="switch"]') as HTMLInputElement;

    expect(input).toBeTruthy();
    check(input, true);
    expect(sw.checked.val).toBe(true);
    await tick();
    expect(el.querySelector("span[aria-hidden]")!.className).toContain("bg-accent");
  });

  test("required en Form usa su mensaje propio", async () => {
    let called = false;
    const form = Form(() => {
      called = true;
    });
    form.add(Switch({ name: "gdpr", required: true }));

    const el = mount(form.dom() as HTMLFormElement);
    await submit(el);
    expect(called).toBe(false);
    expect(el.textContent).toContain("You must turn this option on");

    check(el.querySelector("input[name=gdpr]") as HTMLInputElement, true);
    await submit(el);
    expect(called).toBe(true);
  });
});

describe("RadioGroup", () => {
  const build = () =>
    RadioGroup({
      name: "plan",
      ariaLabel: "Plan",
      options: [
        { value: "basic", label: "Básico" },
        { value: "pro", label: "Pro" },
        { value: "business", label: "Empresarial", disabled: true },
      ],
    });

  test("selección excluyente con value reactivo", async () => {
    const rg = build();
    const el = mount(rg.dom() as HTMLElement);
    const inputs = [...el.querySelectorAll("input[type=radio]")] as HTMLInputElement[];
    expect(inputs.length).toBe(3);

    check(inputs[1], true);
    expect(rg.value.val).toBe("pro");
    await tick();
    expect(inputs[0].checked).toBe(false);
    expect(inputs[1].checked).toBe(true);
  });

  test("ignora opciones deshabilitadas", () => {
    const rg = build();
    const el = mount(rg.dom() as HTMLElement);
    const business = el.querySelectorAll("input[type=radio]")[2] as HTMLInputElement;

    check(business, true);
    expect(rg.value.val).toBe("");
  });

  test("flechas navegan saltando deshabilitadas y con foco roving", async () => {
    const rg = build();
    const el = mount(rg.dom() as HTMLElement);
    const inputs = [...el.querySelectorAll("input[type=radio]")] as HTMLInputElement[];

    inputs[0].focus();
    inputs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(rg.value.val).toBe("pro"); // business está deshabilitada: se salta
    await tick();
    expect(document.activeElement).toBe(inputs[1]);

    inputs[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(rg.value.val).toBe("basic"); // envuelve hasta la primera habilitada
  });

  test("required en Form: sin selección bloquea, con selección pasa", async () => {
    let called = false;
    let data: Record<string, unknown> | null = null;
    const form = Form((d) => {
      called = true;
      data = d;
    });
    form.add(
      RadioGroup({
        name: "choice",
        required: true,
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      }),
    );

    const el = mount(form.dom() as HTMLFormElement);
    await submit(el);
    expect(called).toBe(false);
    expect(el.textContent).toContain("Please select an option");

    check(el.querySelector("input[value=b]") as HTMLInputElement, true);
    await submit(el);
    expect(called).toBe(true);
    expect(data).toEqual({ choice: "b" });
  });
});

describe("TextareaField", () => {
  test("renderiza <textarea> y valida requerido", () => {
    const ta = TextareaField({ name: "msg" });
    expect(ta.validate("")).toBe(false);
    expect(ta.validate("hola")).toBe(true);

    const el = mount(ta.dom() as HTMLElement);
    expect(el.querySelector("textarea")).toBeTruthy();
  });

  test("Form junta textarea + checkbox required", async () => {
    let data: Record<string, unknown> | null = null;
    const form = Form((d) => {
      data = d;
    });
    form.add(TextareaField({ name: "msg" }), Checkbox({ name: "ok", required: true }));

    const el = mount(form.dom() as HTMLFormElement);
    (el.querySelector("textarea") as HTMLTextAreaElement).value = "contenido";
    check(el.querySelector("input[name=ok]") as HTMLInputElement, true);
    await submit(el);

    expect(data).toEqual({ msg: "contenido", ok: "on" });
  });
});
