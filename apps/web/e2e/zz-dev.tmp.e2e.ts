import { test } from "@playwright/test";
test("dev light flight", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    localStorage.setItem("dcq.aboutSeen", "1");
    localStorage.setItem("dcq.tutorialSeen", "1");
    localStorage.setItem(
      "dcq.a11y",
      JSON.stringify({
        textScaleIndex: 1,
        theme: "light",
        crtReduced: true,
        travel: true,
        kill: true,
      }),
    );
  });
  await page.setViewportSize({ width: 1280, height: 760 });
  await page.goto("http://localhost:5173/");
  await page.locator('[data-world-card="boss-fights"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: "/private/tmp/claude-501/-Applications-Data-Cleaning-Quest/87aebda5-f39e-4e07-a464-fe0bfb345d98/scratchpad/dev-light.png",
  });
  const info = await page.evaluate(() => {
    const el = document.querySelector("[data-travel]");
    if (!el) return "no overlay";
    const cs = getComputedStyle(el);
    return JSON.stringify({
      cls: el.className,
      bg: cs.backgroundImage.slice(0, 100),
      op: cs.opacity,
      vis: cs.visibility,
      z: cs.zIndex,
      pos: cs.position,
    });
  });
  console.log("INFO " + info);
});
