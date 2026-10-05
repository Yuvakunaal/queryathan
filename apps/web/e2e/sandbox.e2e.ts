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

for (const engine of ["sql", "python"] as EngineName[]) {
  test(`up to four of your own tables can be joined, in a collage (${engine})`, async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await seed(page);
    await page.goto("/");
    await page.getByRole("button", { name: /Sandbox/ }).click();
    const csv = (name: string, text: string) => ({
      name,
      mimeType: "text/csv",
      buffer: Buffer.from(text),
    });
    await page.setInputFiles(
      'input[aria-label="Choose a CSV file"]',
      csv("orders.csv", "order_id,customer_id,product_id\n1,C1,P1\n2,C2,P2\n3,C1,P2\n"),
    );
    await expect(page.getByText("orders.csv")).toBeVisible();
    // Two more tables of our own, with names to use in code.
    const another = 'input[aria-label="Choose another CSV file to join"]';
    await page.setInputFiles(
      another,
      csv("customers.csv", "customer_id,customer_name\nC1,Ann\nC2,Bo\n"),
    );
    await page.setInputFiles(
      another,
      csv("products.csv", "product_id,product_name\nP1,Kettle\nP2,Lamp\n"),
    );
    await expect(page.getByLabel("Name in code")).toHaveCount(2);
    await expect(page.getByLabel("Name in code").first()).toHaveValue("customers");
    // A fourth table of our own; after that there is no more room.
    await page.setInputFiles('input[aria-label="Choose another CSV file to join"]', {
      name: "Store List.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("store_id,store_name\nS1,Riverside\nS2,Old Town\n"),
    });
    await expect(page.getByLabel("Name in code")).toHaveCount(3);
    await expect(page.getByLabel("Name in code").nth(2)).toHaveValue("store_list");
    await expect(page.getByRole("button", { name: "Add a table" })).toHaveCount(0);
    await page.getByRole("button", { name: "Open in the editor" }).click();
    await page.getByText(engine === "python" ? "PYTHON" : "SQL", { exact: true }).click();
    await page.locator(".cm-content").waitFor({ timeout: 120_000 });
    // Four tables make a 2 by 2 collage.
    await expect(page.locator("[data-collage-pane]")).toHaveCount(4);
    await expect(
      page.getByRole("group", { name: "How to show the tables" }),
    ).toContainText("4 tables");
    // Code can use all of them by name.
    await setCode(
      page,
      engine === "sql"
        ? "SELECT o.order_id, c.customer_name, p.product_name, s.store_name FROM data o LEFT JOIN customers c ON c.customer_id = o.customer_id LEFT JOIN products p ON p.product_id = o.product_id LEFT JOIN store_list s ON s.store_id = 'S1' LIMIT 3;"
        : "df.merge(customers, on='customer_id').merge(products, on='product_id').assign(store=store_list.iloc[0]['store_name']).head(3)",
    );
    await run(page);
    await expect(page.locator("#pane-result")).toContainText("Riverside", {
      timeout: 30_000,
    });
  });
}
