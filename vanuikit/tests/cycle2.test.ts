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
  test("logs the initial value and every change, and returns the same State", async () => {
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

      expect(logs.length).toBe(2); // initial + change
      expect(String(logs[0][0])).toContain("vanuikit:trace");
      expect(String(logs[0][0])).toContain("demo");
      expect(logs[1][1]).toBe("b");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("debug — expectReactive", () => {
  test("passes when the binding reacts", async () => {
    const s = van.state("one");
    await expectReactive({
      render: () => van.tags.span(s),
      act: () => (s.val = "two"),
      text: "two",
    });
  });

  test("fails with gotcha hints when the binding is frozen", async () => {
    const s = van.state("one");
    let error: Error | null = null;
    try {
      await expectReactive({
        // Static text: no binding to react (frozen case).
        render: () => van.tags.span("fixed text"),
        act: () => (s.val = "two"),
        contains: "two",
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).toBeTruthy();
    expect(error!.message).toContain("did not react");
    expect(error!.message).toContain("keepConnected"); // educational hints
  });

  test("validates exact text and contains", async () => {
    const s = van.state("Hello");
    await expectReactive({
      render: () => van.tags.span(s),
      act: () => (s.val = "Hello world"),
      contains: "world",
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
  test("renders semantic <kbd> with sizes", () => {
    const el = mount(Kbd({}, "Ctrl") as HTMLElement);
    expect(el.tagName).toBe("KBD");
    expect(el.textContent).toBe("Ctrl");
    expect(el.className).toContain("font-mono");

    const sm = Kbd({ size: "sm" }, "⏘") as HTMLElement;
    expect(sm.className).toContain("text-[10px]");
  });
});

describe("pageSlots (ranges with ellipsis)", () => {
  test("small total: all pages", () => {
    expect(pageSlots(2, 5, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  test("at start: no left ellipsis", () => {
    expect(pageSlots(1, 20, 1)).toEqual([1, 2, "ellipsis-r", 20]);
  });

  test("at center: ellipsis on both sides", () => {
    expect(pageSlots(10, 20, 1)).toEqual([1, "ellipsis-l", 9, 10, 11, "ellipsis-r", 20]);
  });

  test("at end: no right ellipsis", () => {
    expect(pageSlots(20, 20, 1)).toEqual([1, "ellipsis-l", 19, 20]);
  });

  test("clamps an out-of-range page", () => {
    expect(pageSlots(99, 20, 1)).toEqual([1, "ellipsis-l", 19, 20]);
  });
});

describe("Pagination", () => {
  test("marks aria-current, navigates with prev/next and disables edges", async () => {
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

  test("clicking a number navigates; decorative ellipsis are not buttons", async () => {
    const page = van.state(10);
    const el = mount(Pagination({ page, totalPages: 20 }) as HTMLElement);
    expect(el.textContent).toContain("…");
    expect(el.querySelectorAll("button").length).toBe(2 + 5); // prev/next + 1,9,10,11,20

    const nine = [...el.querySelectorAll("button")].find((b) => b.textContent === "9")!;
    nine.click();
    await tick();
    expect(page.val).toBe(9);
  });

  test("reactive totalPages", async () => {
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
        { value: "es", label: "Spanish" },
        { value: "en", label: "English" },
        { value: "fr", label: "French" },
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

  test("choosing adds a chip, does NOT close the panel and clears the query", async () => {
    const { dom, input, panel, values } = build();
    mount(dom);
    input().focus();
    await tick();

    key(input(), "Enter"); // selects the first one (Spanish)
    await tick();
    expect(values.val).toEqual(["es"]);
    expect(panel().classList.contains("hidden")).toBe(false); // stays open
    expect(input().value).toBe(""); // query cleared
    expect(dom.textContent).toContain("Spanish"); // chip visible
  });

  test("re-choosing a chipped option removes it (toggle)", async () => {
    const { dom, input, values } = build();
    mount(dom);
    input().focus();
    await tick();
    key(input(), "Enter");
    await tick();
    key(input(), "Enter"); // same index still focused: toggle off
    await tick();
    expect(values.val).toEqual([]);
  });

  test("the chip's × button removes it (with aria-label)", async () => {
    const { dom, input, values } = build();
    mount(dom);
    input().focus();
    await tick();
    key(input(), "Enter");
    await tick();

    const removeBtn = dom.querySelector('button[aria-label*="Spanish"]') as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();
    removeBtn.click();
    await tick();
    expect(values.val).toEqual([]);
  });

  test("Backspace on empty input removes the last chip", async () => {
    const { dom, input, values } = build();
    mount(dom);
    input().focus();
    await tick();
    key(input(), "Enter"); // focus is already on Spanish
    await tick();
    key(input(), "ArrowDown"); // English
    key(input(), "Enter");
    await tick();
    expect(values.val).toEqual(["es", "en"]);

    key(input(), "Backspace");
    await tick();
    expect(values.val).toEqual(["es"]);
  });

  test("Form/required: validates against the accumulated selection", async () => {
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
