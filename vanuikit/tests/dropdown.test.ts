import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { SelectDropdown, DropdownMenu } from "../src/components/dropdown.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("SelectDropdown", () => {
  test("renders the button with the initial option selected", async () => {
    const selected = van.state("es");
    const el = SelectDropdown({
      options: [
        { value: "es", label: "Español" },
        { value: "en", label: "English" },
      ],
      value: selected,
    });

    document.body.appendChild(el);
    await tick();

    const btn = el.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement;
    expect(btn.textContent).toContain("Español");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  test("clicking opens the listbox and allows selecting an option", async () => {
    let changedValue = "";
    const selected = van.state("es");

    const el = SelectDropdown({
      options: [
        { value: "es", label: "Español" },
        { value: "en", label: "English" },
      ],
      value: selected,
      onChange: (val) => (changedValue = val),
    });

    document.body.appendChild(el);
    await tick();

    const btn = el.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement;
    btn.click();
    await tick();

    expect(btn.getAttribute("aria-expanded")).toBe("true");
    const options = el.querySelectorAll('[role="option"]');
    expect(options.length).toBe(2);

    (options[1] as HTMLElement).click();
    await tick();

    expect(selected.val).toBe("en");
    expect(changedValue).toBe("en");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  test("clicking the chevron span keeps the listbox open (regression)", async () => {
    const selected = van.state("es");
    const el = SelectDropdown({
      options: [
        { value: "es", label: "Español" },
        { value: "en", label: "English" },
      ],
      value: selected,
    });

    document.body.appendChild(el);
    await tick();

    const btn = el.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement;
    const chevron = [...btn.querySelectorAll("span")].find(
      (s) => s.textContent?.trim() === "▼",
    );
    expect(chevron).toBeDefined();

    // Click exactly on the chevron glyph. The chevron is a function-child: when
    // `isOpen` flips, van re-renders it and detaches the node that received the
    // click. The outside-click handler must not interpret that as a click
    // outside the control and immediately close the menu.
    (chevron as HTMLElement).click();
    await tick();

    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("DropdownMenu", () => {
  test("expands items on trigger click and runs the callback", async () => {
    let clicked = false;
    const el = DropdownMenu({
      trigger: () => van.tags.button("Acciones"),
      items: [
        { label: "Editar", onClick: () => (clicked = true) },
        { type: "divider" },
        { label: "Eliminar", destructive: true },
      ],
    });

    document.body.appendChild(el);
    await tick();

    const triggerWrapper = el.firstElementChild as HTMLElement;
    triggerWrapper.click();
    await tick();

    const menu = el.querySelector('[role="menu"]');
    expect(menu).not.toBeNull();

    const editBtn = el.querySelectorAll('[role="menuitem"]')[0] as HTMLButtonElement;
    editBtn.click();
    await tick();

    expect(clicked).toBe(true);
  });
});
