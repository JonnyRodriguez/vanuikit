import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

function summarize(violations: { id: string; impact?: string; nodes: unknown[] }[]) {
  return violations
    .map((v) => `${v.impact ?? "?"} ${v.id} (${v.nodes.length} nodos)`)
    .join("\n");
}

test.describe("a11y axe harness", () => {
  test("components page: no critical/serious violations", async ({ page }) => {
    await page.goto("/components");

    const results = await new AxeBuilder({ page })
      .withTags(TAGS)
      .analyze();

    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    );

    if (serious.length > 0) {
      console.log("Violaciones críticas/graves encontradas:");
      console.log(summarize(serious));
    }

    expect(summarize(serious)).toBe("");
  });
});
