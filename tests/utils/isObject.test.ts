import isObject from "../../src/utils/isObject.js";
import { describe, it, expect } from "vitest";

describe("Test if value is an object literal", () => {
  it("should return true b/c value is an object", () => {
    const val = isObject({ test: "123" });

    expect(val).toBe(true);
  });
  it("should return true despite object being empty", () => {
    const val = isObject({});

    expect(val).toBe(true);
  });
  it("should return false b/c val is an array", () => {
    const val = isObject([]);

    expect(val).toBe(false);
  });
  it("should return false b/c val is a null value", () => {
    const val = isObject(null);

    expect(val).toBe(false);
  });
  it("should return false b/c val is a primitive type", () => {
    const val = isObject(300);

    expect(val).toBe(false);
  });
  it("should return false b/c val is undefined", () => {
    const val = isObject(undefined);

    expect(val).toBe(false);
  });
});
