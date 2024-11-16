import isObject from "./isObject.js";

function flattenObject(obj: { [key: string]: any }) {
  if (!isObject(obj)) {
    throw new Error(`value is not an object to be flattened.`);
  }
  return Object.keys(obj).reduce((acc, k) => {
    if (
      typeof obj[k] === "object" &&
      obj[k] !== null &&
      !Array.isArray(obj[k])
    ) {
      Object.assign(acc, flattenObject(obj[k]));
    } else {
      acc[k] = obj[k];
    }
    return acc;
  }, {} as { [index: string]: any });
}

export default flattenObject;
