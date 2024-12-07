export default function getImgFromText(str: string): undefined | string {
  if (str.length === 0) return undefined;
  let strMutate = str;

  // if (str && str.includes("src=")) {
  //   console.log("input->", str);
  //   const src = str.split("src=")[1].split(/[ >]/)[0].replace(/"|'/g, "");

  //   if (src.includes("?")) {
  //     const removedQuery = src.split("?")[0];
  //     return removedQuery;
  //   }
  //   return src;
  // }
  while (strMutate && strMutate.includes("src=")) {
    const imgSrc = strMutate
      .split("src=")[1]
      .split(/[ >]/)[0]
      .replace(/"|'/g, "");
    strMutate = strMutate.replace("src=", "");
    if (/(jpg|gif|png|webp|jpeg)/gi.test(imgSrc) || /image/gi.test(imgSrc)) {
      return imgSrc;
    }
  }
  return undefined;
}
