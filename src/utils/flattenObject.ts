function flattenObject(obj: { [index: string]: any }) {
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
