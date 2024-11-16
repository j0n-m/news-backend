import { it, expect, describe } from "vitest";
import getImgFromText from "../../src/utils/getImgFromText.js";

describe("Test extracting <img> element's src URL", () => {
  it("should correctly return the src url", () => {
    const content = `<img src="https://example.com"/>`;
    expect(getImgFromText(content)).toMatch("https://example.com");
  });
  it("should return empty string for an empty src url", () => {
    const content = `<img src="" />`;
    expect(getImgFromText(content)).toMatch("");
  });
  it("should return undefined for element without src attribute", () => {
    const content = `<img />`;
    expect(getImgFromText(content)).toBe(undefined);
  });
  it("should return the first src url for an <img> nested inside another element", () => {
    const content = `
    <div>
     <div>
      <img src="one.com" />
      <img src="two.com" />
     </div>
    </div>
    `;
    expect(getImgFromText(content)).toMatch("one.com");
  });
});
