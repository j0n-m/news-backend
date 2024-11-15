import Parser from "rss-parser";
import isObject from "./isObject.js";
import flattenObject from "./flattenObject.js";
import getImgFromText from "./getImgFromText.js";

async function rssParser(
  feedURL: string,
  { skip = 0, limit = 5 }: { skip?: number; limit?: number } = {}
) {
  const parser = new Parser({
    customFields: {
      feed: ["icon", "image"],
      item: [
        ["media:content", "media:content", { keepArray: false }],
        ["content:encoded", "content:encoded", { keepArray: false }],
        ["media:thumbnail", "media:thumbnail", { keepArray: false }],
        ["author", "author", { keepArray: false }],
        ["image", "image", { keepArray: false }],
        ["img", "img", { keepArray: false }],
        ["description", "description", { keepArray: false }],
      ],
    },
    defaultRSS: 2.0,
  });
  const feed = await parser.parseURL(feedURL);

  const formatted_feed = feed.items
    .map((data, i) => {
      // console.log(data.description);
      let imageURL =
        data["media:content"] ||
        data["media:thumbnail"] ||
        data.image ||
        data.img ||
        data.enclosure ||
        getImgFromText(data?.content || "") ||
        getImgFromText(data?.description || "") ||
        feed.icon ||
        feed.image ||
        "";

      imageURL =
        typeof imageURL === "string" ? imageURL : flattenObject(imageURL);

      if (typeof imageURL !== "string") {
        for (const key in imageURL) {
          // console.log(imageURL[key]);
          if (
            typeof imageURL[key] === "string" &&
            imageURL[key].includes("http")
          ) {
            imageURL = imageURL[key];
            break;
            //array?
          } else if (typeof imageURL[key] === "object") {
            //b/c filter returns an array, we only want to return the string in the first index
            imageURL = imageURL[key].filter((str: any) => /http/i.test(str))[0];
          }
        }
      }

      return {
        content: data["content:encoded"] || data["content"],
        image_url: imageURL,
        title: data.title,
        content_snippet: data.contentSnippet || "",
        pubDate: data.pubDate,
        id: i,
        author: data.creator || data.author,
        source_link: data.link,
      };
    })
    .filter((obj) => {
      if (obj.id >= skip) {
        return obj != null;
      }
      return false;
    })
    .filter((obj, i) => {
      if (i < limit) {
        return obj != null;
      }
      return false;
    });

  return {
    feed_title: feed.title,
    feed_link: feed.link,
    feed_description: feed.description,
    items: formatted_feed,
  };
}

export default rssParser;
