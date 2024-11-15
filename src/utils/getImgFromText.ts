export default function getImgFromText(str: string): undefined | string {
  if (str.length === 0) return undefined;

  if (str && str.includes("src=")) {
    const src = str.split("src=")[1].split(/[ >]/)[0].replace(/"|'/g, "");
    if (src.includes("?")) {
      const removedQuery = src.split("?")[0];
      return removedQuery;
    }
    return src;
  }
  return undefined;
}
