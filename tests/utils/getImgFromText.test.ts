import { it, expect, describe } from "vitest";
import getImgFromText from "../../src/utils/getImgFromText.js";

describe("Test extracting <img> element's src URL", () => {
  it("should return undefined for non valid src url", () => {
    const content = `<img src="https://example.com"/>`;
    expect(getImgFromText(content)).toBe(undefined);
  });
  it("should correctly return the src url", () => {
    const content = `<img src="https://example.com/images/test.jpg"/>`;
    expect(getImgFromText(content)).toMatch(
      "https://example.com/images/test.jpg"
    );
  });
  it("should return undefined for an empty src url", () => {
    const content = `<img src="" />`;
    expect(getImgFromText(content)).toBe(undefined);
  });
  it("should return undefined for element without src attribute", () => {
    const content = `<img />`;
    expect(getImgFromText(content)).toBe(undefined);
  });
  it("should return the first valid url for an <img> nested inside another element", () => {
    const content = `
    <div>
     <div>
      <img src="one.com" />
      <img src="two.jpg" />
     </div>
    </div>
    `;
    expect(getImgFromText(content)).toMatch("two.jpg");
  });
  it("should return a valid src url within escaped html content", () => {
    const content = `
    "\u003Cdiv id=\"\" class=\"hds-image-carousel grid-container grid-container-block padding-top-8 padding-bottom-8 hds-module hds-module-full wp-block-nasa-blocks-image-carousel\"\u003E\t\t\u003Cdiv class=\"hds-carousel-wrapper\"\u003E\n\t\t\t\u003Cdiv class=\"image-carousel-slider margin-0\" id=\"image-carousel-slider\"\u003E\n\t\t\t\t\t\t\t\t\t\t\t\u003Cdiv class=\"display-block width-full\"\u003E\n\t\t\t\t\t\t\t\u003Cfigure class=\"margin-0\"\u003E\n\t\t\t\t\t\t\t\t\u003Cdiv class=\"hds-cover-wrapper hds-image-carousel-slide margin-bottom-2\"\u003E\n\t\t\t\t\t\t\t\t\u003Cdiv class=\"hds-media-wrapper margin-left-auto margin-right-auto\"\u003E\u003Cfigure class=\"hds-media-inner hds-cover-wrapper hds-media-ratio-cover \"\u003E\u003Cimg fetchpriority=\"high\" decoding=\"async\" width=\"1024\" height=\"576\" src=\"https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?w=1024\" class=\"attachment-large size-large\" alt=\"\" style=\"transform: scale(1); transform-origin: 50% 50%; object-position: 50% 50%; object-fit: cover;\" block_context=\"nasa-block\" srcset=\"https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg 7821w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=300,169 300w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=768,432 768w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=1024,576 1024w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=1536,864 1536w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=2048,1152 2048w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=400,225 400w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=600,337 600w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=900,506 900w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=1200,675 1200w, https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg?resize=2000,1125 2000w\" sizes=\"(max-width: 1024px) 100vw, 1024px\" loading=\"eager\" /\u003E\u003C/figure\u003E\u003Cfigcaption class=\"hds-caption padding-y-2\"\u003E\u003Cdiv class=\"hds-caption-text p-sm margin-0\"\u003EMembers belonging to one of three teams from Oakwood School aim their devices — armed with chocolate-coated-peanut candies — at a target during JPL’s annual Invention Challenge on Dec. 6.\u003C/div\u003E\u003Cdiv class=\"hds-credits\"\u003ENASA/JPL-Caltech\u003C/div\u003E\u003C/figcaption\u003E\u003C/div\u003E\t\t\t\t\t\t\t\t\u003C/div\u003E\n\t\t\t\t\t\t\t\u003C/figure\u003E\n\t\t\t\t\t\t\u003C/div\u003E\n\t\t\t\t\t\t\t\t\t\t\t\u003Cdiv class=\"display-block width-full\"\u003E\n\t\t\t\t\t\t\t\u003Cfigure class=\"margin-0\"\u003E\n\t\t\t\t\t\t\t\t\u003Cdiv class=\"hds-cover-wrapper hds-image-carousel-slide margin-bottom-2\"\u003E\n\t\t\t\t\t\t\t\t\u003Cdiv class=\"hds-media-wrapper
    `;
    const result = getImgFromText(content);
    expect(result).toMatch(
      "https://www.nasa.gov/wp-content/uploads/2024/12/1-oakwood.jpg"
    );
  });
});
