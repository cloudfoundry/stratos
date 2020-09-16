
export function mergeObjects(src: any, ...dest: any): any {
  // Copy src
  const data = JSON.parse(JSON.stringify(src));
  // Merge in all of the dest objects
  for (const obj of dest) {
    doMergeObjects(data, obj);
  }

  return data;
}

// merge from dest into src
function doMergeObjects(src: any, dest: any) {
  // Go through the keys of dest an update them in src
  Object.keys(dest).forEach(key => {
    if (typeof(dest[key]) === 'object' && !Array.isArray(dest)) {
      if (!src[key]) {
        src[key] = {};
      }
      doMergeObjects(src[key], dest[key]);
    } else {
      src[key] = dest[key]
    }
  });
}
