
export function mergeObjects(src: Record<string, unknown>, ...dest: Record<string, unknown>[]): Record<string, unknown> {
  // Copy src
  const data = JSON.parse(JSON.stringify(src));
  // Merge in all of the dest objects
  for (const obj of dest) {
    doMergeObjects(data, obj);
  }

  return data;
}

// merge from dest into src
function doMergeObjects(src: Record<string, unknown>, dest: Record<string, unknown>): void {
  // Go through the keys of dest an update them in src
  if (!dest) {
    return;
  }

  Object.keys(dest).forEach(key => {
    if (typeof (dest[key]) === 'object' && !Array.isArray(dest)) {
      if (!src[key]) {
        src[key] = {};
      }
      doMergeObjects(src[key] as Record<string, unknown>, dest[key] as Record<string, unknown>);
    } else {
      src[key] = dest[key];
    }
  });
}
