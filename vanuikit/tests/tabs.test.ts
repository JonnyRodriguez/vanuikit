import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { Tabs } from "../src/components/tabs.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("Tabs", () => {
  test("renders tabs and shows the initial active content", async () => {
    const el = Tabs({
      items: [
        { id: "tab1", label: "General", content: () => van.tags.div("General content") },
        { id: "tab2", label: "Advanced", content: () => van.tags.div("Advanced content") },
      ],
    });

    document.body.appendChild(el);
    await tick();

    const tabs = el.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(el.textContent).toContain("General content");
  });

  test("clicking another tab changes the active panel and runs onChange", async () => {
    let changedTo = "";
    const el = Tabs({
      items: [
        { id: "t1", label: "Tab 1", content: () => van.tags.div("Panel 1") },
        { id: "t2", label: "Tab 2", content: () => van.tags.div("Panel 2") },
      ],
      onChange: (id) => (changedTo = id),
    });

    document.body.appendChild(el);
    await tick();

    const tab2Btn = el.querySelectorAll('[role="tab"]')[1] as HTMLButtonElement;
    tab2Btn.click();
    await tick();

    expect(changedTo).toBe("t2");
    expect(tab2Btn.getAttribute("aria-selected")).toBe("true");
    expect(el.textContent).toContain("Panel 2");
  });

  test("disabled tab does not respond to click", async () => {
    let changed = false;
    const el = Tabs({
      items: [
        { id: "t1", label: "Tab 1", content: () => "Panel 1" },
        { id: "t2", label: "Tab 2", disabled: true, content: () => "Panel 2" },
      ],
      onChange: () => (changed = true),
    });

    document.body.appendChild(el);
    await tick();

    const tab2Btn = el.querySelectorAll('[role="tab"]')[1] as HTMLButtonElement;
    tab2Btn.click();
    await tick();

    expect(changed).toBe(false);
    expect(tab2Btn.getAttribute("aria-selected")).toBe("false");
  });
});
