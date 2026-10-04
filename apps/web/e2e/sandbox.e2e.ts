import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures";
import { run, seed, setCode } from "./helpers";
import type { EngineName } from "./helpers";

const MESSY =
  'name;city;city;score\nAva;Austin;TX;10\n Liam ;Leeds;UK;\nAva;Austin;TX;10\n"Zoe, Jr";Lyon;FR;7\n';

async function openSandbox(page: import("@playwright/test").Page, engine: EngineName) {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Sandbox/ }).click();
  await page.setInputFiles('input[type="file"]', {
    name: "messy.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(MESSY),
  });
  await expect(page.getByText("Read as semicolon-separated")).toBeVisible();
  await expect(
    page.getByText('A second column named "city" was renamed city_2.'),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open in the editor" }).click();
  await page.getByText(engine === "python" ? "PYTHON" : "SQL", { exact: true }).click();
  await page.locator(".cm-content").waitFor({ timeout: 120_000 });
}

for (const engine of ["sql", "python"] as EngineName[]) {
  test(`your own CSV can be cleaned and downloaded (${engine})`, async ({ page }) => {
    await openSandbox(page, engine);
    await expect(page.getByText("4 rows ·")).toBeVisible();
    await page.getByRole("button", { name: "Count missing values per column" }).click();
    await run(page);
    await expect(page.locator("#pane-result")).toContainText("score");
    await setCode(
      page,
      engine === "sql"
        ? "UPDATE data SET name = TRIM(name);\nDELETE FROM data WHERE rowid NOT IN (SELECT MIN(rowid) FROM data GROUP BY name, city, city_2, score);"
        : "df['name'] = df['name'].str.strip()\ndf = df.drop_duplicates().reset_index(drop=True)",
    );
    await run(page);
    await expect(page.getByText("3 rows ·")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download CSV" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("messy-cleaned.csv");
    const path = await download.path();
    expect(readFileSync(path, "utf8")).toBe(
      'name,city,city_2,score\nAva,Austin,TX,10\nLiam,Leeds,UK,\n"Zoe, Jr",Lyon,FR,7\n',
    );
  });
}

test("a file with no data rows is refused with a plain message", async ({ page }) => {
  await seed(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Sandbox/ }).click();
  await page.setInputFiles('input[type="file"]', {
    name: "empty.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("a,b\n"),
  });
  await expect(page.getByRole("alert")).toContainText("no data rows");
});
