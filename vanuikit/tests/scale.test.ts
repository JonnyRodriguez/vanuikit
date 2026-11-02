import { describe, test, expect, afterEach } from "bun:test";
import van from "vanjs-core";
import { Avatar, getInitials } from "../src/components/avatar.js";
import { Breadcrumbs } from "../src/components/breadcrumbs.js";
import { Card, CardTitle } from "../src/components/card.js";
import { Accordion } from "../src/components/accordion.js";
import { Combobox } from "../src/components/combobox.js";
import { Form } from "../src/components/form.js";
import { UserBadge } from "../src/components/user-badge.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

// VanJS updates bindings in a microtask; tests must wait for it.
const tick = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  document.body.style.overflow = "";
});

describe("Avatar", () => {
  test("getInitials: two words, one word, empty", () => {
    expect(getInitials("Ana Morales")).toBe("AM");
    expect(getInitials("  Chavo ")).toBe("CH");
    expect(getInitials("", "U")).toBe("U");
    expect(getInitials("x", "U")).toBe("X");
  });

  test("renders initials and the name's aria-label (including State)", async () => {
    const name = van.state("Lucía Fernández");
    const el = mount(Avatar({ name, size: "sm" }) as HTMLElement);
    await tick();
    expect(el.textContent).toBe("LF");
    expect(el.getAttribute("aria-label")).toBe("Lucía Fernández");

    name.val = "Beto";
    await tick();
    expect(el.textContent).toBe("BE");
  });

  test("src falls back to initials when the image fails", async () => {
    const el = mount(Avatar({ name: "Ana Morales", src: "inexistente.png" }) as HTMLElement);
    const img = el.querySelector("img")!;
    expect(img).toBeTruthy();

    img.dispatchEvent(new Event("error"));
    await tick();
    expect(el.querySelector("img")).toBeNull();
    expect(el.textContent).toBe("AM");
  });
});

describe("UserBadge + Avatar compartido", () => {
  test("keeps showing the user's initials", () => {
    const el = mount(
      van.tags.div({}, UserBadge({ user: { name: "Carla Ruiz", email: "carla@x.co" } } as any)) as HTMLElement,
    );
    expect(el.textContent).toContain("CR");
    expect(el.textContent).toContain("Carla Ruiz");
  });
});

describe("Breadcrumbs", () => {
  test("navigable anchors, last one with aria-current and separators", () => {
    const el = mount(
      Breadcrumbs({
        items: [
          { label: "Inicio", href: "/" },
          { label: "***REMOVED***", href: "/***REMOVED***" },
          { label: "Detalle" },
        ],
      }) as HTMLElement,
    );
    const links = [...el.querySelectorAll("a")];
    expect(links.length).toBe(2);
    expect(links[0].getAttribute("href")).toBe("/");
    const current = el.querySelector('[aria-current="page"]')!;
    expect(current.textContent).toBe("Detalle");
    expect(el.textContent).toContain("/");
    expect(el.tagName).toBe("NAV");
    expect(el.getAttribute("aria-label")).toBeTruthy();
  });

  test("intermediate hrefs are anchors; the last one is always aria-current", () => {
    const el = mount(
      Breadcrumbs({
        items: [
          { label: "A" },
          { label: "B", href: "/b" },
          { label: "C", href: "/c" },
          { label: "D", href: "/d" },
        ],
      }) as HTMLElement,
    );
    expect(el.querySelectorAll("a").length).toBe(2); // B and C; A has no href, D is the page
    expect(el.querySelector('[aria-current="page"]')!.textContent).toBe("D");
  });
});

describe("Card", () => {
  test("base surface + hoverable + CardTitle", () => {
    const el = mount(Card({ hoverable: true }, CardTitle({}, "Hola"), "cuerpo") as HTMLElement);
    expect(el.className).toContain("bg-card");
    expect(el.className).toContain("hover:shadow-md");
    expect(el.querySelector("h3")?.textContent).toBe("Hola");
  });
});

describe("Accordion", () => {
  const build = (extra = {}) =>
    Accordion({
      items: [
        { id: "a", title: "Primera", content: () => van.tags.p("Contenido A") },
        { id: "b", title: "Segunda", content: () => van.tags.p("Contenido B") },
      ],
      ...extra,
    }) as HTMLElement;

  test("default: opening one closes the other; aria-expanded and region", async () => {
    const el = mount(build());
    const buttons = [...el.querySelectorAll("button")];
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");

    buttons[0].click();
    await tick();
    expect(buttons[0].getAttribute("aria-expanded")).toBe("true");
    expect(el.textContent).toContain("Contenido A");
    const region = el.querySelector('[role="region"]:not([class*="hidden"])')!;
    expect(region.getAttribute("aria-labelledby")).toBe(buttons[0].id);

    buttons[1].click();
    await tick();
    expect(buttons[0].getAttribute("aria-expanded")).toBe("false");
    expect(buttons[1].getAttribute("aria-expanded")).toBe("true");
    expect(el.textContent).toContain("Contenido B");
    expect(el.textContent).not.toContain("Contenido A");
  });

  test("multiple: several open at once; re-click closes", async () => {
    const el = mount(build({ multiple: true }));
    const buttons = [...el.querySelectorAll("button")];
    buttons[0].click();
    buttons[1].click();
    await tick();
    expect(el.textContent).toContain("Contenido A");
    expect(el.textContent).toContain("Contenido B");

    buttons[1].click();
    await tick();
    expect(el.textContent).not.toContain("Contenido B");
    expect(el.textContent).toContain("Contenido A");
  });

  test("defaultOpen and content factory invoked on each open", async () => {
    let builds = 0;
    const el = mount(
      Accordion({
        defaultOpen: ["a"],
        items: [
          { id: "a", title: "A", content: () => (builds++, van.tags.p("A" + builds)) },
        ],
      }) as HTMLElement,
    );
    await tick();
    expect(el.textContent).toContain("A1");

    (el.querySelector("button") as HTMLButtonElement).click(); // close
    await tick();
    (el.querySelector("button") as HTMLButtonElement).click(); // reopen
    await tick();
    expect(el.textContent).toContain("A2"); // factory re-invoked
  });

  test("disabled: the button does not open", async () => {
    const el = mount(
      Accordion({
        items: [{ id: "x", title: "X", content: () => van.tags.p("X"), disabled: true }],
      }) as HTMLElement,
    );
    (el.querySelector("button") as HTMLButtonElement).click();
    await tick();
    expect(el.querySelector('[role="region"]')!.className).toContain("hidden");
  });
});

describe("Combobox", () => {
  const build = (extra = {}) => {
    const value = van.state("");
    const field = Combobox({
      name: "demo-cb",
      value,
      options: [
        { value: "ar", label: "Argentina" },
        { value: "bo", label: "Bolivia" },
        { value: "co", label: "Colombia" },
        { value: "br", label: "Brasil", disabled: true },
      ],
      ...extra,
    });
    const dom = field.dom() as HTMLElement;
    return { value, dom, input: () => dom.querySelector('input[type="text"]') as HTMLInputElement };
  };
  const type = (input: HTMLInputElement, text: string) => {
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const key = (input: HTMLInputElement, key: string) =>
    input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));

  test("focus opens, filtering narrows options, Esc closes and shows the selection", async () => {
    const { dom, input } = build();
    mount(dom);
    const panel = () => dom.querySelector('[role="listbox"]')!.parentElement!;

    input().focus();
    await tick();
    expect(panel().classList.contains("hidden")).toBe(false);
    expect(dom.querySelectorAll('[role="option"]').length).toBe(4);

    type(input(), "col");
    await tick();
    const opts = [...dom.querySelectorAll('[role="option"]')];
    expect(opts.length).toBe(1);
    expect(opts[0].textContent).toBe("Colombia");

    key(input(), "Escape");
    await tick();
    expect(panel().classList.contains("hidden")).toBe(true);
    expect(input().value).toBe(""); // no selection, no query
  });

  test("arrows navigate skipping disabled, Enter selects and the input reflects the label", async () => {
    const { dom, input, value } = build();
    mount(dom);
    input().focus();
    await tick();

    // Focus already highlighted the first enabled option (Argentina)
    expect(input().getAttribute("aria-activedescendant")).toContain("opt-0");
    key(input(), "ArrowDown"); // Bolivia
    await tick();
    expect(input().getAttribute("aria-activedescendant")).toContain("opt-1");
    key(input(), "ArrowDown"); // Colombia
    await tick();
    expect(input().getAttribute("aria-activedescendant")).toContain("opt-2");
    key(input(), "ArrowDown"); // wraps: skips Brasil (disabled) → Argentina
    await tick();
    expect(input().getAttribute("aria-activedescendant")).toContain("opt-0");
    key(input(), "ArrowUp"); // backwards also skips Brasil → Colombia
    await tick();
    expect(input().getAttribute("aria-activedescendant")).toContain("opt-2");

    key(input(), "Enter");
    await tick();
    expect(value.val).toBe("co");
    expect(
      (dom.querySelector('[role="listbox"]')!.parentElement as HTMLElement).classList.contains("hidden"),
    ).toBe(true);
    expect(input().value).toBe("Colombia");
    expect(input().getAttribute("aria-expanded")).toBe("false");
  });

  test("selection with click (mousedown does not steal the input's focus)", async () => {
    const { dom, input, value } = build();
    mount(dom);
    input().focus();
    await tick();
    const opt = [...dom.querySelectorAll('[role="option"]')][1] as HTMLElement;
    opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    opt.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await tick();
    expect(value.val).toBe("bo");
    expect(document.activeElement).toBe(input());
  });

  test("external State drives: closed shows the value's label", async () => {
    const { dom, input, value } = build();
    mount(dom);
    value.val = "ar";
    await tick();
    expect(input().value).toBe("Argentina");
  });

  test("click outside closes", async () => {
    const { dom, input } = build();
    mount(dom);
    input().focus();
    await tick();
    const panel = dom.querySelector('[role="listbox"]')!.parentElement as HTMLElement;
    expect(panel.classList.contains("hidden")).toBe(false);

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await tick();
    expect(panel.classList.contains("hidden")).toBe(true);
  });

  test("required in Form: without selection blocks, with selection passes", async () => {
    let called = false;
    let data: Record<string, unknown> | null = null;
    const form = Form((d) => {
      called = true;
      data = d;
    });
    form.add(Combobox({ name: "pais", required: true, options: [{ value: "ar", label: "Argentina" }] }));

    const el = mount(form.dom() as HTMLFormElement);
    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(called).toBe(false);
    expect(el.textContent).toContain("Please select an option");

    const input = el.querySelector('input[type="text"]') as HTMLInputElement;
    input.focus();
    await tick();
    key(input, "Enter"); // first option focused on open
    await tick();
    el.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await tick();
    expect(called).toBe(true);
    expect(data).toEqual({ pais: "ar" });
  });
});
