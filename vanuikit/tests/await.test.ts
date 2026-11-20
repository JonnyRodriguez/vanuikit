import { describe, test, expect } from "bun:test";
import { Await } from "../src/components/await.js";

const mount = (node: HTMLElement) => {
  document.body.replaceChildren(node);
  return node;
};

// VanJS updates bindings in a microtask; tests must wait for it.
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("Await", () => {
  test("shows the loading slot while pending, then the success slot", async () => {
    let resolve!: (v: string) => void;
    const p = new Promise<string>((res) => {
      resolve = res;
    });
    const el = mount(
      Await({
        promise: p,
        loading: () => document.createTextNode("…"),
        success: (d) => document.createTextNode(`Hello ${d}`),
      }),
    );
    expect(el.textContent).toBe("…");
    resolve("world");
    await tick();
    expect(el.textContent).toBe("Hello world");
  });

  test("renders the error slot on rejection", async () => {
    const el = mount(
      Await({
        promise: Promise.reject(new Error("boom")),
        error: (e) => document.createTextNode(`err:${(e as Error).message}`),
        success: () => document.createTextNode("never"),
      }),
    );
    await tick();
    expect(el.textContent).toBe("err:boom");
  });

  test("accepts a promise factory", async () => {
    const el = mount(
      Await({
        promise: () => Promise.resolve(42),
        success: (n) => document.createTextNode(String(n)),
      }),
    );
    await tick();
    expect(el.textContent).toBe("42");
  });

  test("without a loading slot renders empty while pending", async () => {
    let resolve!: () => void;
    const p = new Promise<void>((res) => {
      resolve = res;
    });
    const el = mount(
      Await({
        promise: p,
        success: () => document.createTextNode("done"),
      }),
    );
    expect(el.textContent).toBe("");
    resolve();
    await tick();
    expect(el.textContent).toBe("done");
  });
});
