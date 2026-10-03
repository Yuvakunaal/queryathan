import { describe, expect, it } from "vitest";
import { coerceCsvValue, inferColumnTypes, parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a simple CSV into columns and rows", () => {
    const result = parseCsv("a,b,c\n1,2,3\n4,5,6\n");
    expect(result.columns).toEqual(["a", "b", "c"]);
    expect(result.rows).toEqual([
      ["1", "2", "3"],
      ["4", "5", "6"],
    ]);
  });

  it("handles a quoted field containing a comma", () => {
    const result = parseCsv('sku,name\nSKU-1,"Widget, Deluxe"\n');
    expect(result.rows).toEqual([["SKU-1", "Widget, Deluxe"]]);
  });

  it("handles an escaped quote inside a quoted field", () => {
    const result = parseCsv('id,note\n1,"she said ""hi"""\n');
    expect(result.rows).toEqual([["1", 'she said "hi"']]);
  });

  it("handles a file with no trailing newline", () => {
    const result = parseCsv("a,b\n1,2");
    expect(result.rows).toEqual([["1", "2"]]);
  });

  it("preserves an empty field as an empty string", () => {
    const result = parseCsv("a,b,c\n1,,3\n");
    expect(result.rows).toEqual([["1", "", "3"]]);
  });
});

describe("inferColumnTypes", () => {
  it("infers int for a column of whole numbers", () => {
    const types = inferColumnTypes(["age"], [["30"], ["45"]]);
    expect(types.age).toBe("int");
  });

  it("infers float when any value has a decimal point", () => {
    const types = inferColumnTypes(["age"], [["30"], ["45.5"]]);
    expect(types.age).toBe("float");
  });

  it("infers string when any single value is non-numeric", () => {
    const types = inferColumnTypes(["quantity"], [["30"], ["out of stock"], ["12"]]);
    expect(types.quantity).toBe("string");
  });

  it("treats empty cells as null, not as evidence against numeric inference", () => {
    const types = inferColumnTypes(["age"], [["30"], [""], ["45"]]);
    expect(types.age).toBe("int");
  });

  it("infers string for an entirely empty column", () => {
    const types = inferColumnTypes(["notes"], [[""], [""]]);
    expect(types.notes).toBe("string");
  });
});

describe("coerceCsvValue", () => {
  it("converts an empty string to null regardless of type", () => {
    expect(coerceCsvValue("", "int")).toBeNull();
    expect(coerceCsvValue(undefined, "string")).toBeNull();
  });

  it("converts an int-typed value to a real number", () => {
    expect(coerceCsvValue("42", "int")).toBe(42);
  });

  it("converts a float-typed value to a real number", () => {
    expect(coerceCsvValue("3.5", "float")).toBe(3.5);
  });

  it("keeps a string-typed value as text", () => {
    expect(coerceCsvValue("out of stock", "string")).toBe("out of stock");
  });
});
