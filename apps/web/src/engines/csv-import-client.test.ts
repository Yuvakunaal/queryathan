import { describe, expect, it, vi } from "vitest";
import { SANDBOX_LIMITS } from "../lib/sandbox";
import { CsvImportClient } from "./csv-import-client";

/** jsdom's File has no text()/arrayBuffer(), so a browser-shaped one is built by hand. */
function fakeFile(content: string, size = content.length) {
  const text = vi.fn(() => Promise.resolve(content));
  const arrayBuffer = vi.fn(() =>
    Promise.resolve(new TextEncoder().encode(content).buffer),
  );
  return {
    file: { name: "t.csv", size, text, arrayBuffer } as unknown as File,
    text,
    arrayBuffer,
  };
}

// There is no Worker here, so these exercise the main-thread fallback, which must behave identically.
describe("CsvImportClient without a worker", () => {
  it("prepares text the same way the plain function does, with hints", async () => {
    const { result } = await new CsvImportClient().prepare("a;b\n1;2\n");
    if (!result.ok) throw new Error(result.message);
    expect(result.data.columns).toEqual(["a", "b"]);
    expect(result.data.notes[0]).toMatch(/semicolon/);
    expect(result.data.hints?.a?.numeric).toBe(true);
  });

  it("reads a File and works out tooltips only when asked", async () => {
    const { file } = fakeFile("id,city\n1,Austin\n2,Denver\n");
    const plain = await new CsvImportClient().prepare(file);
    expect(plain.tips).toBeUndefined();
    const withTips = await new CsvImportClient().prepare(file, { withTips: true });
    expect(withTips.tips?.id?.mysql).toBeDefined();
    expect(Object.keys(withTips.tips ?? {})).toEqual(["id", "city"]);
  });

  it("refuses a file by its size without reading any of it", async () => {
    const { file, text, arrayBuffer } = fakeFile(
      "a\n1\n",
      SANDBOX_LIMITS.maxBytes * 2 + 1,
    );
    const { result } = await new CsvImportClient().prepare(file, { withTips: true });
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.message).toMatch(/^That file is 10\.0 MB\./);
    expect(text).not.toHaveBeenCalled();
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it("passes a bad file's message through unchanged", async () => {
    const { result } = await new CsvImportClient().prepare("   \n");
    expect(result.ok ? "" : result.message).toMatch(/empty/);
  });
});
