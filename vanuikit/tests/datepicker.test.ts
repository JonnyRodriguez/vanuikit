import { describe, test, expect, afterEach } from "bun:test";
import van from "vanjs-core";
import { DatePicker } from "../src/components/datepicker.js";
import { Form } from "../src/components/form.js";
import { i18n } from "../src/i18n.js";

const { div } = van.tags;

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};
const tick = () => new Promise((r) => setTimeout(r, 0));

const dayBtn = (el: HTMLElement, isoDate: string) =>
  el.querySelector(`button[data-date="${isoDate}"]`) as HTMLButtonElement;

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

afterEach(() => {
  i18n.setLocale("en");
  document.body.replaceChildren();
});

describe("DatePicker — inline", () => {
  test("renders the grid and navigates months with prev/next", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 0, 15) });
    const el = mount(field.dom() as HTMLElement);

    expect(el.querySelector("table")).toBeTruthy();
    expect(el.textContent).toContain("January 2026");
    // 7 header columns + day-15 button present
    expect(el.querySelectorAll("thead th").length).toBe(7);
    expect(dayBtn(el, "2026-01-15")).toBeTruthy();
    expect(dayBtn(el, "2026-02-15")).toBeFalsy();

    // Navigate to the next month: both the title AND the grid must update
    const next = el.querySelector('button[aria-label="Next month"]') as HTMLButtonElement;
    next.click();
    await tick();
    expect(el.textContent).toContain("February 2026");
    expect(dayBtn(el, "2026-02-15")).toBeTruthy();
    expect(dayBtn(el, "2026-01-15")).toBeFalsy();
  });

  test("navigate then select picks the day of the visible month (not January)", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 0, 15) });
    const el = mount(field.dom() as HTMLElement);

    const next = el.querySelector('button[aria-label="Next month"]') as HTMLButtonElement;
    next.click();
    next.click();
    await tick();
    expect(dayBtn(el, "2026-03-20")).toBeTruthy();

    dayBtn(el, "2026-03-20").click();
    await tick();
    expect(field.value.val).toBe("2026-03-20");
  });

  test("two pickers sharing a State: navigating and selecting in one does not break the other", async () => {
    const shared = van.state<Date | null>(new Date(2026, 0, 15));
    const popup = DatePicker({ name: "due-date", value: shared, required: true });
    const inline = DatePicker({
      inline: true,
      value: shared,
      min: new Date(2026, 0, 1),
      max: new Date(2026, 11, 31),
    });
    const popupNode = popup.dom();
    const inlineNode = inline.dom();
    mount(div(popupNode, inlineNode));

    const nextInline = inlineNode.querySelector('button[aria-label="Next month"]') as HTMLButtonElement;
    nextInline.click();
    nextInline.click();
    await tick();
    expect(dayBtn(inlineNode, "2026-03-10")).toBeTruthy();

    dayBtn(inlineNode, "2026-03-10").click();
    await tick();
    expect(inline.value.val).toBe("2026-03-10");
    expect(shared.val!.getMonth()).toBe(2);
  });

  test("selecting a day updates field.value (ISO) and the external State", async () => {
    const ext = van.state<Date | null>(new Date(2026, 0, 15));
    const field = DatePicker({ inline: true, value: ext });
    const el = mount(field.dom() as HTMLElement);

    dayBtn(el, "2026-01-20").click();
    await tick();

    expect(field.value.val).toBe("2026-01-20");
    expect(isoDate(ext.val!)).toBe("2026-01-20");
    expect(field.isTouched.val).toBe(true);
  });

  test("Today button selects the current date", async () => {
    const field = DatePicker({ inline: true });
    const el = mount(field.dom() as HTMLElement);

    const today = [...el.querySelectorAll("button")].find(
      (b) => b.textContent!.trim() === "Today",
    ) as HTMLButtonElement;
    today.click();
    await tick();

    expect(field.value.val).toBe(isoDate(new Date()));
  });
});

describe("DatePicker — popup", () => {
  test("opens on click, picks and closes", async () => {
    const field = DatePicker({ value: new Date(2026, 0, 15) });
    const el = mount(field.dom() as HTMLElement);

    const input = el.querySelector('input[type="text"]') as HTMLInputElement;
    const panel = el.querySelector(".datepicker-popup") as HTMLElement;

    expect(panel.classList.contains("hidden")).toBe(true);
    input.click();
    await tick();
    expect(panel.classList.contains("hidden")).toBe(false);

    dayBtn(el, "2026-01-20").click();
    await tick();
    expect(field.value.val).toBe("2026-01-20");
    expect(panel.classList.contains("hidden")).toBe(true);
  });

  test("Escape closes the popup", async () => {
    const field = DatePicker({ value: new Date(2026, 0, 15) });
    const el = mount(field.dom() as HTMLElement);
    const panel = el.querySelector(".datepicker-popup") as HTMLElement;

    (el.querySelector('input[type="text"]') as HTMLInputElement).click();
    await tick();
    expect(panel.classList.contains("hidden")).toBe(false);

    (el.querySelector('input[type="text"]') as HTMLInputElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await tick();
    expect(panel.classList.contains("hidden")).toBe(true);
  });
});

describe("DatePicker — min/max bounds", () => {
  test("disables days outside the range", () => {
    const field = DatePicker({
      inline: true,
      value: new Date(2026, 0, 15),
      min: new Date(2026, 0, 10),
      max: new Date(2026, 0, 20),
    });
    const el = mount(field.dom() as HTMLElement);

    expect(dayBtn(el, "2026-01-05").disabled).toBe(true);
    expect(dayBtn(el, "2026-01-10").disabled).toBe(false);
    expect(dayBtn(el, "2026-01-15").disabled).toBe(false);
    expect(dayBtn(el, "2026-01-20").disabled).toBe(false);
    expect(dayBtn(el, "2026-01-25").disabled).toBe(true);
  });
});

describe("DatePicker — Form", () => {
  test("required: without a date blocks, with a date passes", async () => {
    let called = false;
    const form = Form(() => {
      called = true;
    });
    const field = DatePicker({ name: "due", required: true });
    form.add(field);
    const el = mount(form.dom() as HTMLFormElement);

    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(called).toBe(false);
    expect(field.isInvalid.val).toBe(true);

    // The grid shows the current month; pick day 1 of this month.
    const now = new Date();
    const dayOne = new Date(now.getFullYear(), now.getMonth(), 1);
    dayBtn(el, isoDate(dayOne)).click();
    await tick();

    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(called).toBe(true);
    expect(field.isInvalid.val).toBe(false);
  });
});

describe("DatePicker — locale reactivity", () => {
  test("the month title reformats when the locale changes", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 0, 15) });
    mount(field.dom() as HTMLElement);
    expect(document.body.textContent).toContain("January");

    i18n.setLocale("es");
    await new Promise((r) => setTimeout(r, 20));
    // cSpell:disable — asserted string comes from the builtin es dictionary.
    expect(document.body.textContent).toContain("Enero");
    // cSpell:enable
  });
});

describe("DatePicker — full keyboard", () => {
  const grid = (el: HTMLElement) => el.querySelector('[tabindex="0"]') as HTMLElement;
  const key = (g: HTMLElement, k: string, opts: KeyboardEventInit = {}) =>
    g.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...opts }));

  test("PageUp/PageDown and Shift navigate months and years", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 5, 15) });
    const el = mount(field.dom() as HTMLElement);
    const g = grid(el);

    key(g, "PageDown");
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-07-15");

    key(g, "PageDown", { shiftKey: true });
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2027-07-15");

    key(g, "PageUp");
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2027-06-15");

    key(g, "PageUp", { shiftKey: true });
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-06-15");
  });

  test("Home/End/Ctrl+Home/Ctrl+End jump to month/year boundaries", async () => {
    const field = DatePicker({ inline: true, value: new Date(2026, 5, 15) });
    const el = mount(field.dom() as HTMLElement);
    const g = grid(el);

    key(g, "Home");
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-06-01");

    key(g, "End");
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-06-30");

    key(g, "Home", { ctrlKey: true });
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-01-01");

    key(g, "End", { ctrlKey: true });
    key(g, "Enter");
    await tick();
    expect(field.value.val).toBe("2026-12-31");
  });
});

describe("DatePicker — reactive bounds (State)", () => {
  test("mutating min/max updates disabled days", async () => {
    const min = van.state<Date | null>(null);
    const max = van.state<Date | null>(null);
    const field = DatePicker({ inline: true, value: new Date(2026, 0, 15), min, max });
    const el = mount(field.dom() as HTMLElement);

    expect(dayBtn(el, "2026-01-20").disabled).toBe(false);

    min.val = new Date(2026, 0, 18);
    max.val = new Date(2026, 0, 22);
    await tick();

    expect(dayBtn(el, "2026-01-15").disabled).toBe(true);
    expect(dayBtn(el, "2026-01-20").disabled).toBe(false);
    expect(dayBtn(el, "2026-01-25").disabled).toBe(true);
  });
});
