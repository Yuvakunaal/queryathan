import { test as base, expect } from "@playwright/test";

/**
 * Every test fails if the page throws an uncaught error or the browser reports
 * a Content-Security-Policy violation (the app is served with the production
 * CSP), even if the assertions the test cares about pass.
 */
export const test = base.extend<{ guard: undefined }>({
  guard: [
    async ({ page }, use, testInfo) => {
      const problems: string[] = [];
      page.on("pageerror", (error) => {
        problems.push(`pageerror: ${error.message}`);
      });
      page.on("console", (message) => {
        const text = message.text();
        if (/Content Security Policy|violates the following|Refused to/i.test(text)) {
          problems.push(`csp: ${text}`);
        }
      });
      await use(undefined);
      // A test that breaks something on purpose (an aborted download) says which page error is expected.
      const allowed = testInfo.annotations
        .filter((a) => a.type === "allow-pageerror")
        .map((a) => a.description ?? "");
      for (let i = problems.length - 1; i >= 0; i--) {
        if (allowed.some((text) => problems[i]?.includes(text))) problems.splice(i, 1);
      }
      expect(problems, "no uncaught errors or CSP violations").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
