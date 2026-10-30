import { describe, test, expect, afterEach, spyOn } from "bun:test";
import van from "vanjs-core";
import { trace, expectReactive } from "../src/debug.js";
import { Kbd } from "../src/components/kbd.js";
import { Pagination, pageSlots } from "../src/components/pagination.js";
import { Combobox } from "../src/components/combobox.js";
import { Form } from "../src/components/form.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};
const tick = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  document.body.style.overflow = "";
});

describe("debug — trace", () => {
  test("loguea el valor inicial y cada cambio, y devuelve el mismo State", async () => {
    const logs: unknown[][] = [];
    const spy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args);
    });
    try {
      const s = van.state("a");
      const returned = trace(s, "demo");
      expect(returned).toBe(s);

      s.val = "b";
      await tick();

      expect(logs.length).toBe(2); // inicial + cambio
      expect(String(logs[0][0])).toContain("vanuikit:trace");
      expect(String(logs[0][0])).toContain("demo");
      expect(logs[1][1]).toBe("b");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("debug — expectReactive", () => {
  test("pasa cuando el binding reacciona", async () => {
    const s = van.state("uno");
    await expectReactive({
      render: () => van.tags.span(s),
      act: () => (s.val = "dos"),
      text: "dos",
    });
  });

  test("falla con pistas de gotchas cuando el binding está congelado", async () => {
    const s = van.state("uno");
    let error: Error | null = null;
    try {
      await expectReactive({
        // Texto estático: ningún binding que reaccionar (caso congelado).
        render: () => van.tags.span("texto fijo"),
        act: () => (s.val = "dos"),
        contains: "dos",
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeTruthy();
    expect(error!.message).toContain("no reaccionó");
    expect(error!.message).toContain("keepConnected"); // pistas educativas
  });

  test("valida text exacto y contiene", async () => {
    const s = van.state("Hola");
    await expectReactive({
      render: () => van.tags.span(s),
      act: () => (s.val = "Hola mundo"),
      contains: "mundo",
    });

    let failed = false;
    try {
      const s2 = van.state("A");
      await expectReactive({
        render: () => van.tags.span(s2),
        act: () => (s2.val = "B"),
        text: "C",
      });
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });
});

describe("Kbd", () => {
  test("renderiza <kbd> semántico con tamaños", () => {
    const el = mount(Kbd({}, "Ctrl") as HTMLElement);
    expect(el.tagName).toBe("KBD");
    expect(el.textContent).toBe("Ctrl");
    expect(el.className).toContain("font-mono");

    const sm = Kbd({ size: "sm" }, "⏘") as HTMLElement;
    expect(sm.className).toContain("text-[10px]");
  });
});

describe("pageSlots (rangos con ellipsis)", () => {
  test("total pequeño: todas las páginas", () => {
    expect(pageSlots(2, 5, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  test("al inicio: sin ellipsis izquierdo", () => {
    expect(pageSlots(1, 20, 1)).toEqual([1, 2, "ellipsis-r", 20]);
  });

  test("al centro: ellipsis en ambos lados", () => {
    expect(pageSlots(10, 20, 1)).toEqual([1, "ellipsis-l", 9, 10, 11, "ellipsis-r", 20]);
  });

  test("al final: sin ellipsis derecho", () => {
    expect(pageSlots(20, 20, 1)).toEqual([1, "ellipsis-l", 19, 20]);
  });

  test("acota la página fuera de rango", () => {
    expect(pageSlots(99, 20, 1)).toEqual([1, "ellipsis-l", 19, 20]);
  });
});

describe("Pagination", () => {
  test("marca aria-current, navega con prev/next y deshabilita extremos", async () => {
    const page = van.state(3);
    const el = mount(Pagination({ page, totalPages: 10 }) as HTMLElement);
    const current = el.querySelector('[aria-current="page"]')!;
    expect(current.textContent).toBe("3");

    const buttons = [...el.querySelectorAll("button")];
    const prev = buttons[0];
    const next = buttons[buttons.length - 1];
    expect(prev.getAttribute("aria-label")).toBe("Previous");
    expect(next.getAttribute("aria-label")).toBe("Next");

    next.click();
    await tick();
    expect(page.val).toBe(4);

    page.val = 1;
    await tick();
    expect((prev as HTMLButtonElement).disabled).toBe(true);

    page.val = 10;
    await tick();
    expect((next as HTMLButtonElement).disabled).toBe(true);
  });

  test("click en número navega; ellipsis decorativos no son botones", async () => {
    const page = van.state(10);
    const el = mount(Pagination({ page, totalPages: 20 }) as HTMLElement);
    expect(el.textContent).toContain("…");
    expect(el.querySelectorAll("button").length).toBe(2 + 5); // prev/next + 1,9,10,11,20

    const nine = [...el.querySelectorAll("button")].find((b) => b.textContent === "9")!;
    nine.click();
    await tick();
    expect(page.val).toBe(9);
  });

  test("totalPages reactivo", async () => {
    const page = van.state(1);
    const total = van.state(3);
    const el = mount(Pagination({ page, totalPages: total }) as HTMLElement);
    expect(el.querySelectorAll("button").length).toBe(2 + 3);
    total.val = 6;
    await tick();
    expect(el.querySelectorAll("button").length).toBe(2 + 6);
  });
});

describe("Combobox multiple", () => {
  const build = () => {
    const values = van.state<string[]>([]);
    const field = Combobox({
      name: "langs",
      multiple: true,
      value: values,
      options: [
        { value: "es", label: "Español" },
        { value: "en", label: "Inglés" },
        { value: "fr", label: "Francés" },
      ],
    });
    const dom = field.dom() as HTMLElement;
    return {
      values,
      field,
      dom,
      input: () => dom.querySelector('input[type="text"]') as HTMLInputElement,
      panel: () => dom.querySelector('[role="listbox"]')!.parentElement as HTMLElement,
      chips: () => [...dom.querySelectorAll("span .rounded-full, span span.rounded-full")] as HTMLElement[],
    };
  };
  const key = (el: HTMLElement, k: string) =>
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

  test("elegir agrega chip, NO cierra el panel y limpia el query", async () => {
    const { dom, input, panel, values } = build();
    mount(dom);
    input().focus();
    await tick();

    key(input(), "Enter"); // selecciona la primera (Español)
    await tick();
    expect(values.val).toEqual(["es"]);
    expect(panel().classList.contains("hidden")).toBe(false); // sigue abierto
    expect(input().value).toBe(""); // query limpio
    expect(dom.textContent).toContain("Español"); // chip visible
  });

  test("re-elegir una opción con chip la quita (toggle)", async () => {
    const { dom, input, values } = build();
    mount(dom);
    input().focus();
    await tick();
    key(input(), "Enter");
    await tick();
    key(input(), "Enter"); // mismo índice aún enfocado: toggle off
    await tick();
    expect(values.val).toEqual([]);
  });

  test("el botón × del chip remueve (con aria-label)", async () => {
    const { dom, input, values } = build();
    mount(dom);
    input().focus();
    await tick();
    key(input(), "Enter");
    await tick();

    const removeBtn = dom.querySelector('button[aria-label*="Español"]') as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();
    removeBtn.click();
    await tick();
    expect(values.val).toEqual([]);
  });

  test("Backspace con input vacío quita el último chip", async () => {
    const { dom, input, values } = build();
    mount(dom);
    input().focus();
    await tick();
    key(input(), "Enter"); // el foco ya está en Español
    await tick();
    key(input(), "ArrowDown"); // Inglés
    key(input(), "Enter");
    await tick();
    expect(values.val).toEqual(["es", "en"]);

    key(input(), "Backspace");
    await tick();
    expect(values.val).toEqual(["es"]);
  });

  test("Form/required: valida contra la selección acumulada", async () => {
    let called = false;
    const form = Form(() => {
      called = true;
    });
    const field = Combobox({
      name: "tags",
      multiple: true,
      required: true,
      options: [{ value: "a", label: "A" }],
    });
    form.add(field);
    const el = mount(form.dom() as HTMLFormElement);

    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(called).toBe(false);

    const input = el.querySelector('input[type="text"]') as HTMLInputElement;
    input.focus();
    await tick();
    key(input, "Enter");
    await tick();
    expect(field.value.val).toBe("a");
    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(called).toBe(true);
  });
});
