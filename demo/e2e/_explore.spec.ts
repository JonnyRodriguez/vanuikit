import { test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dump axe details", async ({ page }) => {
  await page.goto("/components");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();

  for (const v of results.violations) {
    console.log(`\n### ${v.id} [${v.impact}] — ${v.help}`);
    console.log(`    helpUrl: ${v.helpUrl}`);
    for (const n of v.nodes) {
      console.log(`    - target: ${JSON.stringify(n.target)}`);
      console.log(`      html: ${(n.html || "").slice(0, 140)}`);
      const fs = n.failureSummary || "";
      for (const line of fs.split("\n")) {
        console.log(`      failure: ${line}`);
      }
    }
  }
});
