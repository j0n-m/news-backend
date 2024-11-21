import { expect, describe, it } from "vitest";
import flattenObject from "../../src/utils/flattenObject.js";

describe("Determine if objects are correctly flattened", () => {
  it("should return an object that flattens one nested level", () => {
    const obj = {
      level1: {
        level2: "value",
      },
    };
    expect(flattenObject(obj)).toStrictEqual({ level2: "value" });
  });
  it("should return an object that flattens two nested levels", () => {
    const obj = {
      level1: {
        level2: {
          level3: "value",
        },
      },
    };
    expect(flattenObject(obj)).toStrictEqual({ level3: "value" });
  });
  it("should return an object that flattens a non-nested object", () => {
    const obj = {
      level1: "val1",
      level2: "val2",
      level3: "val3",
    };
    expect(flattenObject(obj)).toStrictEqual({
      level1: "val1",
      level2: "val2",
      level3: "val3",
    });
  });
  it("should return an empty object if passed an empty object", () => {
    const obj = {};
    expect(flattenObject(obj)).toStrictEqual({});
  });
  it("should return error is passed in an array", () => {
    expect(() => flattenObject([])).toThrowError();
  });
  it("should throw error for non-object inputs", () => {
    expect(() => flattenObject(null as any)).toThrow(
      "value is not an object to be flattened."
    );
    expect(() => flattenObject(undefined as any)).toThrow(
      "value is not an object to be flattened."
    );
    expect(() => flattenObject(42 as any)).toThrow(
      "value is not an object to be flattened."
    );
    expect(() => flattenObject("string" as any)).toThrow(
      "value is not an object to be flattened."
    );
  });
  it("should keep arrays inside objects as is", () => {
    const input = {
      a: {
        b: [1, 2, 3],
        c: 4,
      },
    };

    const expected = {
      b: [1, 2, 3],
      c: 4,
    };

    expect(flattenObject(input)).toEqual(expected);
  });
  it("should handle null values", () => {
    const input = {
      a: {
        b: null,
        c: 1,
      },
    };

    const expected = {
      b: null,
      c: 1,
    };

    expect(flattenObject(input)).toEqual(expected);
  });
});
