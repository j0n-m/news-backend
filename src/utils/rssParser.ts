import Parser from "rss-parser";
import isObject from "./isObject.js";
import flattenObject from "./flattenObject.js";
import getImgFromText from "./getImgFromText.js";
import { randomUUID } from "crypto";

async function rssParser(
  feedURL: string,
  {
    skip = 0,
    limit = 5,
    feedId,
    title,
  }: { skip?: number; limit?: number; feedId?: string; title?: string } = {}
) {
  const parser = new Parser({
    timeout: 3000,
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
  try {
    const feed = await parser.parseURL(feedURL);

    const formatted_feed = feed.items
      .map((data, i) => {
        // console.log("feed item content", data?.["content"]);
        let imageURL =
          data["media:thumbnail"] ||
          getImgFromText(data?.["content:encoded"] || "") ||
          getImgFromText(data?.description || "") ||
          getImgFromText(data?.["content"] || "") ||
          data["media:content"] ||
          data.image ||
          data.img ||
          data.enclosure ||
          feed.image ||
          feed.icon;

        imageURL =
          typeof imageURL === "string"
            ? imageURL
            : isObject(imageURL)
            ? flattenObject(imageURL)
            : "";

        /*
            &&
              (/(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF|webp)$/gi.test(
                imageURL[key]
              ) ||
                /image/i.test(imageURL[key]))
            */
        if (typeof imageURL !== "string") {
          for (const key in imageURL) {
            if (
              typeof imageURL[key] === "string" &&
              imageURL[key].includes("http")
            ) {
              imageURL = imageURL[key];
              break;
              //array?
            } else if (typeof imageURL[key] === "object") {
              //b/c filter returns an array, we only want to return the string in the first index
              // imageURL = imageURL[key].filter((str: any) =>
              //   /http/i.test(str)
              // )[0];
              if (Array.isArray(imageURL[key])) {
                const src = imageURL[key][0];
                if (typeof src === "string") {
                  imageURL = src;
                }
              } else {
                imageURL = "";
              }

              // break;
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
          url_id: randomUUID(),
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
    // .sort((obj1, obj2) => {
    //   const today = new Date();
    //   const obj1Date = new Date(obj1.pubDate || today);
    //   const obj2Date = new Date(obj2.pubDate || today);
    //   return obj1Date > obj2Date ? -1 : obj1Date < obj2Date ? 1 : 0;
    // });

    return {
      total_items: formatted_feed?.length ?? 0,
      feed_title: title || feed.title,
      feed_link: feed.link,
      id: feedId || feed.link,
      feed_description: feed.description,
      items: formatted_feed,
    };
  } catch (error) {
    // throw new Error("Error: Cannot parse this feed url");
    console.log("rssParser error", error);
    return false;
  }
}

export default rssParser;
