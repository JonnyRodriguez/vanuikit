import { describe, test, expect } from "bun:test";
import van from "vanjs-core";
import { Alert } from "../src/components/alert.js";
import { Progress } from "../src/components/progress.js";
import { Skeleton } from "../src/components/skeleton.js";
import { EmptyState } from "../src/components/empty-state.js";
import { Icon } from "../src/components/icon.js";
import { toast } from "../src/components/toast.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

// VanJS updates bindings in a microtask; tests must wait for it.
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("Alert", () => {
  test("paints the variant, title, content and role=alert", () => {
    const el = mount(
      Alert({ variant: "success", title: "Saved" }, "Your changes have been applied.") as HTMLElement,
    );
    expect(el.getAttribute("role")).toBe("alert");
    expect(el.className).toContain("bg-success/10");
    expect(el.className).toContain("border-success/20");
    expect(el.textContent).toContain("Saved");
    expect(el.textContent).toContain("Your changes have been applied.");
  });

  test("dismissible: the button hides the alert and notifies via onDismiss", async () => {
    let dismissed = false;
    const el = mount(
      Alert({ dismissible: true, onDismiss: () => (dismissed = true) }, "Warning") as HTMLElement,
    );
    const button = el.querySelector("button") as HTMLButtonElement;
    expect(button.getAttribute("aria-label")).toBe("Dismiss alert");

    button.click();
    await tick();

    expect(dismissed).toBe(true);
    expect(el.className).toContain("hidden");
  });

  test("showIcon: false omits the icon; a custom icon replaces it", () => {
    const plain = mount(Alert({ showIcon: false }, "No icon") as HTMLElement);
    expect(plain.querySelector("svg")).toBeNull();

    const custom = mount(
      Alert({ icon: van.tags.span("🚀") }, "With rocket") as HTMLElement,
    );
    expect(custom.querySelector("span")?.textContent).toBe("🚀");
  });

  test("each variant colors the icon with the state's -fg (tokens, no raw palette)", () => {
    const cases: [Parameters<typeof Alert>[0], string][] = [
      [{ variant: "info" }, "text-info-fg"],
      [{ variant: "success" }, "text-success-fg"],
      [{ variant: "warning" }, "text-warning-fg"],
      [{ variant: "error" }, "text-destructive-fg"],
    ];
    for (const [props, fg] of cases) {
      const el = mount(Alert({ ...props }, "Message") as HTMLElement);
      const icon = el.querySelector("svg") as SVGElement;
      expect(icon.getAttribute("class")).toContain(fg);
      expect(icon.getAttribute("class")).not.toMatch(/(blue|emerald|rose|amber)-\d/);
    }
  });
});

describe("toast", () => {
  test("neutral toast on bg-card (re-themable, no raw palette backgrounds)", async () => {
    toast.clear();
    toast.success("Saved", { durationMs: 0 }); // 0: no auto-dismiss during the test
    await tick();

    const el = document.querySelector('[id^="toast-"]') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.className).toContain("bg-card");
    expect(el.className).toContain("border-border");
    expect(el.className).not.toMatch(/(blue|emerald|rose|amber)-900/);

    // The icon carries the state color, the text uses theme tokens.
    const icon = el.querySelector("svg") as SVGElement;
    expect(icon.getAttribute("class")).toContain("text-success-fg");
    expect(el.textContent).toContain("Saved");

    toast.clear();
    await tick(); // van removes the nodes in a microtask
    expect(document.querySelector('[id^="toast-"]')).toBeNull();
  });
});

describe("Progress", () => {
  test("reactive aria-valuenow and width driven by the State", async () => {
    const value = van.state(25);
    const el = mount(Progress({ value, label: "Upload" }) as HTMLElement);
    const track = el.querySelector('[role="progressbar"]') as HTMLElement;
    const fill = track.firstElementChild as HTMLElement;

    expect(track.getAttribute("aria-valuenow")).toBe("25");
    expect(el.textContent).toContain("Upload");
    expect(el.textContent).toContain("25%");

    value.val = 80;
    await tick();
    expect(track.getAttribute("aria-valuenow")).toBe("80");
    expect(fill.style.width).toBe("80%");
    expect(el.textContent).toContain("80%");
  });

  test("clamps the percentage to the 0–100 range", async () => {
    const value = van.state(250);
    const el = mount(Progress({ value }) as HTMLElement);
    const track = el.querySelector('[role="progressbar"]') as HTMLElement;

    expect(track.getAttribute("aria-valuenow")).toBe("100");

    value.val = -5;
    await tick();
    expect(track.getAttribute("aria-valuenow")).toBe("0");
  });

  test("indeterminate: pulses, hides the percentage and does not set width", async () => {
    const el = mount(Progress({ indeterminate: true, label: "Loading" }) as HTMLElement);
    const track = el.querySelector('[role="progressbar"]') as HTMLElement;
    const fill = track.firstElementChild as HTMLElement;

    expect(fill.className).toContain("animate-pulse");
    expect(fill.className).toContain("w-1/3");
    expect(fill.style.width).toBe("");
    expect(el.textContent).toContain("Loading");
    const valueSpan = el.querySelector(".progress-value") as HTMLElement;
    expect(valueSpan.className).toContain("hidden");
  });

  test("showValue: false hides the percentage even when determinate", () => {
    const el = mount(Progress({ value: 40, showValue: false }) as HTMLElement);
    expect(el.textContent).not.toContain("%");
  });
});

describe("Skeleton", () => {
  test("text: 3 lines by default, the last one shorter", () => {
    const el = mount(Skeleton() as HTMLElement);
    const lines = [...el.children] as HTMLElement[];
    expect(lines.length).toBe(3);
    expect(lines[0].className).toContain("w-full");
    expect(lines[2].className).toContain("w-2/3");
  });

  test("lines controls the count; circle and block use their shapes", () => {
    expect((mount(Skeleton({ lines: 5 }) as HTMLElement)).children.length).toBe(5);

    const circle = mount(Skeleton({ variant: "circle" }) as HTMLElement);
    expect(circle.className).toContain("rounded-full");

    const block = mount(Skeleton({ variant: "block" }) as HTMLElement);
    expect(block.className).toContain("h-24");
  });

  test("all skeletons pulse (animate-pulse)", () => {
    for (const variant of ["text", "circle", "block"] as const) {
      const el = mount(Skeleton({ variant }) as HTMLElement);
      const pulsing =
        (el.className.includes("animate-pulse") ? el : el.querySelector(".animate-pulse"));
      expect(pulsing).toBeTruthy();
    }
  });
});

describe("EmptyState", () => {
  test("renders the default icon (SVG inbox), title, description and action", () => {
    const el = mount(
      EmptyState(
        { title: "No data", description: "No records yet", action: van.tags.button("Create") },
      ) as HTMLElement,
    );
    const svg = el.querySelector("svg");
    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(el.textContent).toContain("No data");
    expect(el.textContent).toContain("No records yet");
    expect(el.querySelector("button")?.textContent).toBe("Create");
  });

  test("a custom icon replaces the default one", () => {
    const el = mount(EmptyState({ icon: Icon({ name: "search" }), title: "No results" }) as HTMLElement);
    expect(el.querySelectorAll("svg").length).toBe(1);
    expect(el.querySelector("svg")).toBeInstanceOf(SVGSVGElement);
  });
});
