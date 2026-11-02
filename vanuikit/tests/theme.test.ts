import { describe, test, expect, beforeEach } from "bun:test";
import { createTheme } from "../src/theme.js";

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 10));

describe("createTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
  });

  test("starts with the default mode and syncs DOM attributes", () => {
    const theme = createTheme({ defaultMode: "light" });
    expect(theme.mode.val).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  test("switching to dark adds the dark class and data-theme", async () => {
    const theme = createTheme({ defaultMode: "light" });
    theme.setMode("dark");
    expect(theme.mode.val).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("vanuikit-theme")).toBe("dark");

    await nextTick();
    expect(theme.isDark.val).toBe(true);
  });

  test("toggle alternates between light and dark", async () => {
    const theme = createTheme({ defaultMode: "light" });
    theme.toggle();
    expect(theme.mode.val).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await nextTick();
    expect(theme.isDark.val).toBe(true);

    theme.toggle();
    expect(theme.mode.val).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await nextTick();
    expect(theme.isDark.val).toBe(false);
  });
});
