import { it, expect, describe } from "vitest";
import rssParser from "../../src/utils/rssParser.js";

describe("Test if correctly parses rss feed url", () => {
  it("should return response object for valid feed urls", async () => {
    const feedURL = "https://moxie.foxnews.com/google-publisher/politics.xml";
    const val = await rssParser(feedURL);

    expect(val).toBeDefined();
    expect(val).toHaveProperty("feed_title");
  });
  it("should return false for non feed urls", async () => {
    const feedURL = "youtube.com";
    const res = await rssParser(feedURL);

    expect(res).toBe(false);
  });
  it("should return false for invalid urls", async () => {
    const feedURL = "idk";
    const res = await rssParser(feedURL);
    expect(res).toBe(false);
  });
  it("should return false for empty urls", async () => {
    const feedURL = "";
    const res = await rssParser(feedURL);
    expect(res).toBe(false);
  });
});
