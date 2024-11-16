import { it, expect, describe } from "vitest";
import rssParser from "../../src/utils/rssParser.js";

describe("Test if correctly parses rss feed url", () => {
  it("should return response object for valid feed urls", async () => {
    const feedURL = "https://moxie.foxnews.com/google-publisher/politics.xml";
    const val = await rssParser(feedURL);

    expect(val).toBeDefined();
    expect(val).toHaveProperty("feed_title");
  });
  it("should return error for non feed urls", async () => {
    const feedURL = "youtube.com";

    await expect(() => rssParser(feedURL)).rejects.toThrowError();
  });
  it("should return error for invalid urls", async () => {
    const feedURL = "idk";
    await expect(() => rssParser(feedURL)).rejects.toThrowError();
  });
  it("should return error for empty urls", async () => {
    const feedURL = "";
    await expect(() => rssParser(feedURL)).rejects.toThrowError();
  });
});
