import { test as base, expect } from "@playwright/test";

/**
 * Every test fails if the page throws an uncaught error or the browser reports
 * a Content-Security-Policy violation (the app is served with the production
 * CSP), even if the assertions the test cares about pass.
 */
export const test = base.extend<{ guard: undefined }>({
  guard: [
    async ({ page }, use) => {
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
      expect(problems, "no uncaught errors or CSP violations").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
